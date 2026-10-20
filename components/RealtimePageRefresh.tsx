"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

type PublicTableName = keyof Database["public"]["Tables"] & string;

const sharedTables = [
  "clubs",
  "positions",
  "events",
  "team_members",
  "alumni",
  "site_content",
  "profiles",
  "memberships",
  "event_registrations",
  "event_registration_members",
] as const satisfies readonly PublicTableName[];

const managementTables = [
  "permissions",
  "roles",
  "role_permissions",
  "user_role_assignments",
  "contact_submissions",
  "meeting_attendance_sessions",
  "meeting_attendance",
] as const satisfies readonly PublicTableName[];

/**
 * Refreshes the current server-rendered route after a database change.
 * Supabase RLS continues to decide which row changes can reach this client.
 */
export default function RealtimePageRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const managementRoute = pathname === "/manage" || pathname.startsWith("/manage/");
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    const supabase = createClient(() => getToken());
    const tables: readonly PublicTableName[] = managementRoute
      ? [...sharedTables, ...managementTables]
      : sharedTables;

    let active = true;
    let pendingRefresh = false;
    let channelStarting = false;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    let refreshTimer: number | undefined;
    let retryTimer: number | null = null;
    let retryDelayMs = 1_000;

    const scheduleRefresh = () => {
      if (!active) return;
      if (document.visibilityState !== "visible") {
        pendingRefresh = true;
        return;
      }

      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        refreshTimer = undefined;
        if (!active) return;
        pendingRefresh = false;
        router.refresh();
      }, 180);
    };

    const scheduleRetry = () => {
      if (!active || retryTimer !== null) return;
      const delay = retryDelayMs;
      retryDelayMs = Math.min(retryDelayMs * 2, 30_000);
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (!active || channel || channelStarting) return;
      channelStarting = true;
      const suffix = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const nextChannel = supabase.channel(`techtronica-page-refresh-${managementRoute ? "management" : "public"}-${suffix}`);

      try {
        for (const table of tables) {
          nextChannel
            .on("postgres_changes", { event: "INSERT", schema: "public", table }, scheduleRefresh)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table }, scheduleRefresh)
            .on("postgres_changes", { event: "DELETE", schema: "public", table }, scheduleRefresh);
        }

        channel = nextChannel;
        nextChannel.subscribe((status) => {
          if (!active || channel !== nextChannel) return;
          if (status === "SUBSCRIBED") {
            channelStarting = false;
            retryDelayMs = 1_000;
            if (retryTimer !== null) window.clearTimeout(retryTimer);
            retryTimer = null;
            // Reconcile after joining so changes made during reconnect are not missed.
            scheduleRefresh();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            channel = null;
            channelStarting = false;
            pendingRefresh = true;
            void supabase.removeChannel(nextChannel).catch(() => undefined).then(scheduleRetry);
          }
        });
      } catch {
        if (channel === nextChannel) channel = null;
        channelStarting = false;
        void supabase.removeChannel(nextChannel).catch(() => undefined);
        scheduleRetry();
      }
    };

    const reconciliationTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") scheduleRefresh();
    }, 30_000);

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (pendingRefresh) scheduleRefresh();
      if (!channel) connect();
    };
    const onOnline = () => {
      pendingRefresh = true;
      scheduleRefresh();
      if (!channel) connect();
    };

    connect();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);

    return () => {
      active = false;
      window.clearInterval(reconciliationTimer);
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      if (channel) void supabase.removeChannel(channel).catch(() => undefined);
      channel = null;
    };
  }, [getToken, isLoaded, managementRoute, router]);

  return null;
}
