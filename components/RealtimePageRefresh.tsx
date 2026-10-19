"use client";

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
  "notifications",
  "notification_reads",
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

  useEffect(() => {
    const supabase = createClient();
    const suffix = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const channelName = `techtronica-page-refresh-${managementRoute ? "management" : "public"}-${suffix}`;
    const tables: readonly PublicTableName[] = managementRoute
      ? [...sharedTables, ...managementTables]
      : sharedTables;

    let active = true;
    let pendingRefresh = false;
    let refreshTimer: number | undefined;
    let channel = supabase.channel(channelName);

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

    for (const table of tables) {
      channel = channel
        .on("postgres_changes", { event: "INSERT", schema: "public", table }, scheduleRefresh)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table }, scheduleRefresh);
    }

    channel.subscribe((status) => {
      if (!active) return;
      if (status === "SUBSCRIBED") {
        // Re-fetch once after joining and after reconnecting to reconcile any
        // changes made between the server render and the live subscription.
        pendingRefresh = false;
        scheduleRefresh();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        pendingRefresh = true;
      }
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && pendingRefresh) scheduleRefresh();
    };
    const onOnline = () => {
      pendingRefresh = true;
      scheduleRefresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);

    return () => {
      active = false;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      void supabase.removeChannel(channel).catch(() => undefined);
    };
  }, [managementRoute, router]);

  return null;
}
