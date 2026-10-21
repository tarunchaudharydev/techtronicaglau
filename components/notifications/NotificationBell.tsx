"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, LoaderCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Notice = {
  id: string;
  kind: string;
  title: string;
  message: string;
  href: string;
  published_at: string;
};

const PAGE_SIZE = 30;

export default function NotificationBell({ userId }: { userId: string }) {
  const { getToken } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(() => new Set());
  const [readActionError, setReadActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadedPagesRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const unreadCount = notices.reduce((count, notice) => count + Number(!readIds.has(notice.id) && !pendingReadIds.has(notice.id)), 0);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const supabase = createClient(() => getToken());
      const pageLimit = Math.max(PAGE_SIZE, loadedPagesRef.current * PAGE_SIZE);
      const { data, error } = await supabase
        .from("notifications")
        .select("id, kind, title, message, href, published_at")
        .order("published_at", { ascending: false })
        .order("id", { ascending: false })
        .range(0, pageLimit - 1);

      // The table may not exist until the backend migration is deployed. Treat
      // that as an unavailable feed instead of letting it break the whole page.
      if (error || !data) {
        setBackendAvailable(false);
        return false;
      }

      setBackendAvailable(true);
      setNotices(data);
      hasMoreRef.current = data.length === pageLimit;
      setHasMore(hasMoreRef.current);
      if (!data.length) {
        setReadIds(new Set());
        return true;
      }

      const { data: reads, error: readsError } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", userId)
        .in("notification_id", data.map((notice) => notice.id));

      if (!readsError) {
        // Read receipts are monotonic: a notification cannot become unread again.
        // Merge server results so a slow refresh cannot undo a newer local read.
        setReadIds((current) => new Set([...current, ...(reads ?? []).map((read) => read.notification_id)]));
      }
      return true;
    } catch {
      setBackendAvailable(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getToken, userId]);

  useEffect(() => {
      let active = true;
      let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
      let channelStarting = false;
      let retryTimer: number | null = null;
      let retryDelayMs = 1_000;
      const supabase = createClient(() => getToken());
  
      const scheduleRetry = () => {
        if (!active || retryTimer !== null) return;
        const delay = retryDelayMs;
        retryDelayMs = Math.min(retryDelayMs * 2, 30_000);
        retryTimer = window.setTimeout(() => {
          retryTimer = null;
          void connect();
        }, delay);
      };
  
      const connect = async () => {
        if (!active || channel || channelStarting) return;
        channelStarting = true;
        const available = await refresh();
        if (!active) return;
        if (!available) {
          channelStarting = false;
          scheduleRetry();
          return;
        }
  
        let nextChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
        try {
          const suffix = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
          nextChannel = supabase
            .channel("notification-feed-" + userId + "-" + suffix)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
              if (active) void refresh();
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, () => {
              if (active) void refresh();
            })
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "notification_reads", filter: "user_id=eq." + userId }, () => {
              if (active) void refresh();
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notification_reads", filter: "user_id=eq." + userId }, () => {
              if (active) void refresh();
            });
  
          channel = nextChannel;
          nextChannel.subscribe((status) => {
            if (!active || channel !== nextChannel) return;
            if (status === "SUBSCRIBED") {
              channelStarting = false;
              retryDelayMs = 1_000;
              if (retryTimer !== null) window.clearTimeout(retryTimer);
              retryTimer = null;
              // Reconcile the initial read with the moment the socket joined.
              void refresh();
              return;
            }
  
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
              channel = null;
              channelStarting = false;
              void supabase.removeChannel(nextChannel!).catch(() => undefined).then(scheduleRetry);
            }
          });
        } catch {
          if (nextChannel) {
            if (channel === nextChannel) channel = null;
            void supabase.removeChannel(nextChannel).catch(() => undefined);
          }
          channelStarting = false;
          scheduleRetry();
        }
      };
  
      const refreshOrReconnect = () => {
        if (document.visibilityState !== "visible") return;
        if (channel) void refresh();
        else {
          if (retryTimer !== null) window.clearTimeout(retryTimer);
          retryTimer = null;
          void connect();
        }
      };
  
      void connect();
      const reconciliationTimer = window.setInterval(() => {
        if (document.visibilityState === "visible") void refresh();
      }, 30_000);
      document.addEventListener("visibilitychange", refreshOrReconnect);
      window.addEventListener("online", refreshOrReconnect);
  
      return () => {
        active = false;
        if (retryTimer !== null) window.clearTimeout(retryTimer);
        window.clearInterval(reconciliationTimer);
        document.removeEventListener("visibilitychange", refreshOrReconnect);
        window.removeEventListener("online", refreshOrReconnect);
        if (channel) void supabase.removeChannel(channel).catch(() => undefined);
        channel = null;
      };
    }, [refresh, userId]);


  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
      triggerRef.current?.focus();
    };
  }, [open]);

  async function markRead(notificationId: string) {
    if (readIds.has(notificationId) || pendingReadIds.has(notificationId)) return;

    setReadActionError(null);
    setPendingReadIds((current) => new Set(current).add(notificationId));
    try {
      const supabase = createClient(() => getToken());
      const { error } = await supabase.from("notification_reads").upsert(
        { notification_id: notificationId, user_id: userId, read_at: new Date().toISOString() },
        { onConflict: "notification_id,user_id" },
      );
      if (error) {
        setPendingReadIds((current) => {
          const next = new Set(current);
          next.delete(notificationId);
          return next;
        });
        setReadActionError("Could not save this read status. Please try again.");
        return;
      }

      setReadIds((current) => new Set(current).add(notificationId));
      setPendingReadIds((current) => {
        const next = new Set(current);
        next.delete(notificationId);
        return next;
      });
    } catch {
      setPendingReadIds((current) => {
        const next = new Set(current);
        next.delete(notificationId);
        return next;
      });
      setReadActionError("Could not save this read status. Please try again.");
    }
  }

  async function markAllRead() {
    const unread = notices.filter((notice) => !readIds.has(notice.id) && !pendingReadIds.has(notice.id));
    if (!unread.length) return;

    const unreadIds = unread.map((notice) => notice.id);
    setReadActionError(null);
    // Update the badge and rows immediately, then reconcile with the database.
    setPendingReadIds((current) => new Set([...current, ...unreadIds]));
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await createClient(() => getToken()).from("notification_reads").upsert(
        unread.map((notice) => ({ notification_id: notice.id, user_id: userId, read_at: now })),
        { onConflict: "notification_id,user_id" },
      );
      if (error) {
        setPendingReadIds((current) => {
          const next = new Set(current);
          unreadIds.forEach((id) => next.delete(id));
          return next;
        });
        setReadActionError("Could not save read status. Please try again.");
        return;
      }

      setReadIds((current) => new Set([...current, ...unreadIds]));
      setPendingReadIds((current) => {
        const next = new Set(current);
        unreadIds.forEach((id) => next.delete(id));
        return next;
      });
    } catch {
      setPendingReadIds((current) => {
        const next = new Set(current);
        unreadIds.forEach((id) => next.delete(id));
        return next;
      });
      setReadActionError("Could not save read status. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function loadOlderNotifications() {
    if (!hasMoreRef.current || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const supabase = createClient(() => getToken());
      const start = notices.length;
      const { data, error } = await supabase
        .from("notifications")
        .select("id, kind, title, message, href, published_at")
        .order("published_at", { ascending: false })
        .order("id", { ascending: false })
        .range(start, start + PAGE_SIZE - 1);

      if (error || !data) return;
      setNotices((current) => {
        const seen = new Set(current.map((notice) => notice.id));
        return [...current, ...data.filter((notice) => !seen.has(notice.id))];
      });
      loadedPagesRef.current += 1;
      hasMoreRef.current = data.length === PAGE_SIZE;
      setHasMore(hasMoreRef.current);

      if (data.length) {
        const { data: reads, error: readsError } = await supabase
          .from("notification_reads")
          .select("notification_id")
          .eq("user_id", userId)
          .in("notification_id", data.map((notice) => notice.id));
        if (!readsError) {
          setReadIds((current) => new Set([...current, ...(reads ?? []).map((read) => read.notification_id)]));
        }
      }
    } catch {
      // Existing notices remain usable if loading an older page fails.
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="notification-panel"
        onClick={() => setOpen((current) => !current)}
        className="relative grid size-10 cursor-pointer place-items-center rounded-full text-slate-600 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Bell aria-hidden="true" className="size-[18px]" />
        {unreadCount > 0 && <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-bold leading-none text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[99] cursor-default bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
          />
          <section
            id="notification-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-panel-title"
            className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[min(82dvh,720px)] flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl dark:border-slate-700 dark:bg-slate-900 lg:inset-x-auto lg:right-4 lg:top-24 lg:bottom-auto lg:mt-0 lg:max-h-[min(65vh,520px)] lg:w-[min(92vw,390px)] lg:rounded-2xl lg:pb-0"
          >
            <header className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-3 dark:border-slate-800 sm:py-3">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600 sm:hidden" />
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 id="notification-panel-title" className="font-semibold">Notifications</h2>
                  <p className="text-xs text-slate-500">{unreadCount} unread · latest {notices.length}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" disabled={!unreadCount || saving} onClick={() => void markAllRead()} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-50 dark:text-sky-300 dark:hover:bg-slate-800">
                    {saving ? <LoaderCircle className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}<span className="hidden min-[360px]:inline">Mark all read</span><span className="min-[360px]:hidden">Read all</span>
                  </button>
                  <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-300 dark:hover:bg-slate-800">
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            </header>

            {readActionError && <p role="alert" className="shrink-0 border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{readActionError}</p>}

            <div
              className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
              onScroll={(event) => {
                const element = event.currentTarget;
                if (element.scrollHeight - element.scrollTop - element.clientHeight < 140) {
                  void loadOlderNotifications();
                }
              }}
            >
              {loading ? <p className="p-8 text-center text-sm text-slate-500"><LoaderCircle className="mx-auto mb-2 size-5 animate-spin" />Loading notifications…</p> : notices.length ? notices.map((notice) => {
                const isRead = readIds.has(notice.id) || pendingReadIds.has(notice.id);
                return <Link key={notice.id} href={notice.href} onClick={() => { void markRead(notice.id); setOpen(false); }} className={`block border-b border-slate-100 px-4 py-4 transition hover:bg-sky-50/70 dark:border-slate-800 dark:hover:bg-slate-800/70 ${isRead ? "" : "bg-sky-50/50 dark:bg-sky-950/20"}`}>
                  <span className="flex items-start gap-3"><span className={`mt-1 size-2 shrink-0 rounded-full ${isRead ? "bg-slate-300 dark:bg-slate-600" : "bg-sky-600"}`} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><strong className="line-clamp-1 text-sm">{notice.title}</strong><span className="shrink-0 text-[10px] capitalize text-slate-500">{notice.kind}</span></span><span className="mt-1 block line-clamp-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{notice.message}</span><time className="mt-1 block text-[10px] text-slate-400" dateTime={notice.published_at}>{formatDate(notice.published_at)}</time></span></span>
                </Link>;
              }) : <div className="p-8 text-center"><Bell className="mx-auto size-6 text-slate-300" /><p className="mt-2 text-sm font-medium">{backendAvailable === false ? "Notifications are being set up" : "You’re all caught up"}</p><p className="mt-1 text-xs text-slate-500">{backendAvailable === false ? "The notification service is not available yet. This page will retry automatically." : "New society activity will appear here."}</p></div>}
              {notices.length > 0 && hasMore && (
                <button
                  type="button"
                  onClick={() => void loadOlderNotifications()}
                  disabled={loadingMore}
                  className="flex min-h-11 w-full items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-60 dark:text-sky-300 dark:hover:bg-slate-800"
                >
                  {loadingMore && <LoaderCircle className="size-3.5 animate-spin" />}
                  {loadingMore ? "Loading older updates…" : "Load older notifications"}
                </button>
              )}
            </div>

            <footer className="shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950">
              Showing {notices.length} updates {hasMore ? "· scroll or load more" : "· all available updates"}
            </footer>
          </section>
        </>,
        document.body,
      )}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(date);
}
