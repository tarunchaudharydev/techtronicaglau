type SessionRow = {
  id: string;
  device: string;
  browser: string;
  lastActiveAt: number;
  createdAt: number;
};

export default function ClerkSessionList({ sessions, unavailable, compact = false }: {
  sessions: SessionRow[];
  unavailable: boolean;
  compact?: boolean;
}) {
  if (unavailable) return <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">Your session list is unavailable right now. Open profile settings to manage sign-in devices.</p>;
  if (!sessions.length) return <p className="rounded-xl border border-slate-200 p-4 text-sm text-muted">No active sessions were returned by Clerk.</p>;
  return <ul className={compact ? "divide-y divide-slate-100 dark:divide-slate-800" : "grid gap-3 sm:grid-cols-2"}>
    {sessions.map((session) => (
      <li key={session.id} className={compact ? "flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0" : "rounded-xl border border-slate-200 p-4 dark:border-slate-800"}>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{session.device} · {session.browser}</p>
          <p className="mt-1 text-xs text-muted">Last active {formatDate(session.lastActiveAt)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">Active</span>
      </li>
    ))}
  </ul>;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}
