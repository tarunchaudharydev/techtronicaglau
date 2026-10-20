import type { Database } from "@/types/database";

type AccountSession = Database["public"]["Functions"]["list_my_auth_sessions"]["Returns"][number];
type DeviceKind = "mobile" | "tablet" | "desktop" | "unknown";

type DeviceDetails = {
  kind: DeviceKind;
  type: string;
  operatingSystem: string;
  browserOrApp: string;
};

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
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Device type and browser are estimated from browser-reported data; exact device models may not be available.
      </p>
      <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {visibleSessions.map((session, index) => {
          const device = describeUserAgent(session.user_agent);
          return (
            <li key={`${session.session_created_at}-${index}`} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span aria-hidden="true" className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${session.is_current ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  <DeviceGlyph kind={device.kind} />
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-900">
                    {device.type} <span className="font-normal text-slate-400">·</span> {device.operatingSystem}
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                    <span className="font-medium text-slate-700">{device.browserOrApp}</span>
                    <span aria-hidden="true"> · </span>
                    Signed in {formatDate(session.session_created_at)}
                  </p>
                  <p className="text-xs leading-5 text-slate-500">Session updated {formatDate(session.last_refreshed_at)}</p>
                </div>
              </div>
              <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${session.is_current ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                {session.is_current ? "This device" : "Other device"}
              </span>
            </li>
          );
        })}
      </ul>
      {compact && total > 3 && <p className="mt-2 text-xs text-slate-500">Open session settings to view the latest devices and sign out other sessions.</p>}
    </div>
  );
}

function describeUserAgent(userAgent: string | null): DeviceDetails {
  if (!userAgent) {
    return { kind: "unknown", type: "Unknown device", operatingSystem: "Unknown OS", browserOrApp: "Browser or app unavailable" };
  }

  const ua = userAgent.toLowerCase();
  const isAndroid = /android/.test(ua);
  const isAppleMobile = /iphone|ipad|ipod/.test(ua);
  const isTablet = /ipad|tablet|playbook|silk/.test(ua) || (isAndroid && !/mobile/.test(ua));
  const isMobile = isAppleMobile || /windows phone/.test(ua) || (isAndroid && /mobile/.test(ua)) || /\bmobile\b/.test(ua);

  const kind: DeviceKind = isTablet ? "tablet" : isMobile ? "mobile" : /windows|macintosh|mac os x|cros|linux/.test(ua) ? "desktop" : "unknown";
  const type = kind === "mobile" ? "Mobile"
    : kind === "tablet" ? "Tablet"
    : kind === "desktop" ? "Desktop"
    : "Unknown device";

  const operatingSystem = /iphone|ipad|ipod/.test(ua) ? "iOS"
    : isAndroid ? "Android"
    : /cros/.test(ua) ? "ChromeOS"
    : /windows nt/.test(ua) ? "Windows"
    : /macintosh|mac os x/.test(ua) ? "macOS"
    : /linux/.test(ua) ? "Linux"
    : "Unknown OS";

  const browserOrApp = detectBrowserOrApp(ua, isAppleMobile);
  return { kind, type, operatingSystem, browserOrApp };
}

function detectBrowserOrApp(ua: string, isAppleMobile: boolean) {
  if (/instagram/.test(ua)) return "Instagram in-app browser";
  if (/fban|fbav|fb_iab/.test(ua)) return "Facebook in-app browser";
  if (/linkedinapp/.test(ua)) return "LinkedIn in-app browser";
  if (/tiktok/.test(ua)) return "TikTok in-app browser";
  if (/snapchat/.test(ua)) return "Snapchat in-app browser";
  if (/whatsapp/.test(ua)) return "WhatsApp in-app browser";
  if (/telegram/.test(ua)) return "Telegram in-app browser";
  if (/;\s*wv\)/.test(ua)) return "Android app webview";
  if (isAppleMobile && !/safari|crios|fxios|edgios|opios/.test(ua)) return "iOS app webview";
  if (/samsungbrowser/.test(ua)) return "Samsung Internet";
  if (/edg(e|a|ios)?\//.test(ua)) return "Microsoft Edge";
  if (/opr\//.test(ua)) return "Opera";
  if (/fxios|firefox\//.test(ua)) return "Firefox";
  if (/crios|chrome\//.test(ua)) return "Google Chrome";
  if (/safari\//.test(ua)) return "Safari";
  return "Unknown browser or app";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function DeviceGlyph({ kind }: { kind: DeviceKind }) {
  if (kind === "desktop") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true"><rect x="2.5" y="3.5" width="19" height="13" rx="1.8" /><path d="M8 20.5h8M12 16.5v4" /></svg>;
  }

  if (kind === "tablet") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="2" /><path d="M11 18.5h2" /></svg>;
  }

  if (kind === "mobile") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.2" /><path d="M10.5 18.5h3" /></svg>;
  }

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h6M9 11h6" /></svg>;
}
