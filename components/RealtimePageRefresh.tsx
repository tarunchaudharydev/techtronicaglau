"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

type PublicTableName = keyof Database["public"]["Tables"] & string;

const siteTables = [
  "clubs",
  "positions",
  "events",
  "team_members",
  "alumni",
  "site_content",
  "profiles",
  "memberships",
] as const satisfies readonly PublicTableName[];

const clubTables = [
  "clubs",
  "positions",
  "team_members",
  "alumni",
  "events",
  "memberships",
  "profiles",
] as const satisfies readonly PublicTableName[];

const eventTables = [
  "events",
  "clubs",
  "event_registrations",
  "event_registration_members",
  "memberships",
  "profiles",
] as const satisfies readonly PublicTableName[];

const accountTables = [
  "profiles",
  "memberships",
  "positions",
  "clubs",
  "event_registrations",
  "event_registration_members",
  "meeting_attendance_sessions",
  "meeting_attendance",
] as const satisfies readonly PublicTableName[];

const managementDashboardTables = [
  ...siteTables,
  "permissions",
  "roles",
  "role_permissions",
  "user_role_assignments",
  "contact_submissions",
  "meeting_attendance_sessions",
  "meeting_attendance",
  "event_registrations",
  "event_registration_members",
] as const satisfies readonly PublicTableName[];

const managementTablesByRoute: ReadonlyArray<{
  matches: (pathname: string) => boolean;
  tables: readonly PublicTableName[];
}> = [
  { matches: (path) => path.startsWith("/manage/attendance"), tables: ["meeting_attendance_sessions", "meeting_attendance", "memberships", "profiles", "clubs"] },
  { matches: (path) => path.startsWith("/manage/events"), tables: eventTables },
  { matches: (path) => path.startsWith("/manage/registrations"), tables: ["event_registrations", "event_registration_members", "events", "clubs", "profiles", "memberships"] },
  { matches: (path) => path.startsWith("/manage/alumni"), tables: ["alumni", "clubs", "profiles"] },
  { matches: (path) => path.startsWith("/manage/contacts"), tables: ["contact_submissions"] },
  { matches: (path) => path.startsWith("/manage/content"), tables: ["site_content"] },
  { matches: (path) => path.startsWith("/manage/clubs"), tables: clubTables },
  { matches: (path) => path.startsWith("/manage/positions"), tables: ["positions", "clubs", "roles", "memberships"] },
  { matches: (path) => path.startsWith("/manage/memberships"), tables: ["memberships", "profiles", "clubs", "positions"] },
  { matches: (path) => path.startsWith("/manage/team"), tables: ["team_members", "profiles", "clubs"] },
  { matches: (path) => path.startsWith("/manage/notifications"), tables: ["notifications", "notification_reads"] },
  { matches: (path) => path.startsWith("/manage/access") || path.startsWith("/manage/users"), tables: ["profiles", "memberships", "clubs", "positions", "roles", "permissions", "role_permissions", "user_role_assignments"] },
];

function tablesForPath(pathname: string): readonly PublicTableName[] {
  if (pathname === "/manage") return managementDashboardTables;
  if (pathname.startsWith("/manage/")) {
    return managementTablesByRoute.find(({ matches }) => matches(pathname))?.tables ?? [];
  }
  if (pathname === "/" || pathname.startsWith("/about") || pathname.startsWith("/gallery")) return siteTables;
  if (pathname.startsWith("/clubs")) return clubTables;
  if (pathname.startsWith("/events")) return eventTables;
  if (pathname.startsWith("/account")) return accountTables;
  if (pathname.startsWith("/alumni")) return ["alumni", "clubs", "profiles"];
  return [];
}

/**
 * Refreshes the current server-rendered route after a database change.
 * Supabase RLS continues to decide which row changes can reach this client.
 */
export default function RealtimePageRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    const supabase = createClient(() => getToken());
    const tables = tablesForPath(pathname);
    if (!tables.length) return;

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
      const nextChannel = supabase.channel(`techtronica-page-refresh-${suffix}`);

      try {
        for (const table of tables) {
          nextChannel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh);
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
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      if (channel) void supabase.removeChannel(channel).catch(() => undefined);
      channel = null;
    };
  }, [getToken, isLoaded, pathname, router]);

  return null;
}
