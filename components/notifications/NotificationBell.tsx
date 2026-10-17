"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Notice = {
  id: string;
  kind: string;
  title: string;
  message: string;
  href: string;
  published_at: string;
};

export default function NotificationBell({ userId }: { userId: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const unreadCount = notices.reduce((count, notice) => count + Number(!readIds.has(notice.id)), 0);

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notifications")
        .select("id, kind, title, message, href, published_at")
        .order("published_at", { ascending: false })
        .limit(30);
      if (error || !data) return;
      setNotices(data);
      if (!data.length) { setReadIds(new Set()); return; }
      const { data: reads } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", userId)
        .in("notification_id", data.map((notice) => notice.id));
      setReadIds(new Set((reads ?? []).map((read) => read.notification_id)));
    } catch {
      // Keep the last loaded list available when the network briefly drops.
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void refresh();
    const channel = supabase
      .channel(`notification-feed-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        if (active) void refresh();
      })
      .subscribe();
    const poll = window.setInterval(() => {
      if (active && document.visibilityState === "visible") void refresh();
    }, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  async function markRead(notificationId: string) {
    if (readIds.has(notificationId)) return;
    const supabase = createClient();
    const { error } = await supabase.from("notification_reads").upsert(
      { notification_id: notificationId, user_id: userId, read_at: new Date().toISOString() },
      { onConflict: "notification_id,user_id" },
    );
    if (!error) setReadIds((current) => new Set(current).add(notificationId));
  }

  async function markAllRead() {
    const unread = notices.filter((notice) => !readIds.has(notice.id));
    if (!unread.length) return;
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await createClient().from("notification_reads").upsert(
      unread.map((notice) => ({ notification_id: notice.id, user_id: userId, read_at: now })),
      { onConflict: "notification_id,user_id" },
    );
    if (!error) setReadIds((current) => new Set([...current, ...unread.map((notice) => notice.id)]));
    setSaving(false);
  }

  return (
    <details className="group relative">
      <summary aria-label={`Notifications, ${unreadCount} unread`} className="relative grid size-10 cursor-pointer list-none place-items-center rounded-full text-slate-600 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-200 dark:hover:bg-slate-800">
        <Bell aria-hidden="true" className="size-[18px]" />
        {unreadCount > 0 && <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-bold leading-none text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </summary>
      <section aria-label="Notifications" className="absolute right-0 z-[80] mt-2 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div><h2 className="font-semibold">Notifications</h2><p className="text-xs text-slate-500">{unreadCount} unread in the latest {notices.length} updates</p></div>
          <button type="button" disabled={!unreadCount || saving} onClick={() => void markAllRead()} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-50 dark:text-sky-300 dark:hover:bg-slate-800">
            {saving ? <LoaderCircle className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />} Mark all read
          </button>
        </header>
        <div className="max-h-[min(65vh,520px)] overflow-y-auto">
          {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading notifications…</p> : notices.length ? notices.map((notice) => {
            const isRead = readIds.has(notice.id);
            return <Link key={notice.id} href={notice.href} onClick={() => void markRead(notice.id)} className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-sky-50/70 dark:border-slate-800 dark:hover:bg-slate-800/70 ${isRead ? "" : "bg-sky-50/50 dark:bg-sky-950/20"}`}>
              <span className="flex items-start gap-3"><span className={`mt-1 size-2 shrink-0 rounded-full ${isRead ? "bg-slate-300 dark:bg-slate-600" : "bg-sky-600"}`} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><strong className="line-clamp-1 text-sm">{notice.title}</strong><span className="shrink-0 text-[10px] capitalize text-slate-500">{notice.kind}</span></span><span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{notice.message}</span><time className="mt-1 block text-[10px] text-slate-400" dateTime={notice.published_at}>{formatDate(notice.published_at)}</time></span></span>
            </Link>;
          }) : <div className="p-8 text-center"><Bell className="mx-auto size-6 text-slate-300" /><p className="mt-2 text-sm font-medium">You’re all caught up</p><p className="mt-1 text-xs text-slate-500">New events and society updates will appear here.</p></div>}
        </div>
        <footer className="bg-slate-50 px-4 py-2 text-[11px] text-slate-500 dark:bg-slate-950">Showing the latest 30 updates</footer>
      </section>
    </details>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
