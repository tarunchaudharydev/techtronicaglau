import Link from "next/link";
import type { Database } from "@/types/database";

type AccountSession = Database["public"]["Functions"]["list_my_auth_sessions"]["Returns"][number];

export default function AccountSessionsList({
  sessions,
  unavailable,
  compact = false,
}: {
  sessions: AccountSession[];
  unavailable: boolean;
  compact?: boolean;
}) {
  const total = sessions[0]?.total_sessions ?? 0;
  const visibleSessions = compact ? sessions.slice(0, 3) : sessions;

  if (unavailable) {
    return <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Your session list is unavailable right now. Refresh after the account security update has been applied.</p>;
  }

  if (sessions.length === 0) {
    return <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No active sessions were returned. If this seems wrong, refresh your account.</p>;
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{total.toLocaleString("en-IN")} active {total === 1 ? "device" : "devices"}</p>
        {total > sessions.length && <p className="text-xs text-slate-500">Showing the {sessions.length} most recent</p>}
      </div>
      <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {visibleSessions.map((session, index) => (
          <li key={`${session.session_created_at}-${index}`} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span aria-hidden="true" className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${session.is_current ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                <DeviceGlyph />
              </span>
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-slate-900">{deviceName(session.user_agent)}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Signed in {formatDate(session.session_created_at)} · Session updated {formatDate(session.last_refreshed_at)}
                </p>
              </div>
            </div>
            <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${session.is_current ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
              {session.is_current ? "This device" : "Other device"}
            </span>
          </li>
        ))}
      </ul>
      {compact && total > 3 && <p className="mt-2 text-xs text-slate-500">Open session settings to view the latest devices and sign out other sessions.</p>}
    </div>
  );
}

function deviceName(userAgent: string | null) {
  if (!userAgent) return "Unrecognized browser or device";
  const browser = /Edg\//i.test(userAgent) ? "Microsoft Edge"
    : /OPR\//i.test(userAgent) ? "Opera"
    : /Firefox\//i.test(userAgent) ? "Firefox"
    : /Chrome\//i.test(userAgent) ? "Google Chrome"
    : /Safari\//i.test(userAgent) ? "Safari"
    : "Unknown browser";
  const platform = /iPhone/i.test(userAgent) ? "iPhone"
    : /iPad/i.test(userAgent) ? "iPad"
    : /Android/i.test(userAgent) ? "Android device"
    : /Windows NT/i.test(userAgent) ? "Windows"
    : /Macintosh|Mac OS X/i.test(userAgent) ? "Mac"
    : /Linux/i.test(userAgent) ? "Linux"
    : "unknown device";
  return `${browser} on ${platform}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function DeviceGlyph() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2.4" /><path d="M10 18.5h4" /></svg>;
}
