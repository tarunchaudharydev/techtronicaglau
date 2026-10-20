import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AttendanceStatusPicker, { type AttendanceStatus } from "../AttendanceStatusPicker";
import { requireManager } from "@/lib/manage/server";

const PAGE_SIZE = 50;
const STATUS_FILTERS = ["all", "unmarked", "present", "absent", "excused"] as const;

export const metadata: Metadata = { title: "Take attendance | Techtronica management" };

export default async function AttendanceSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string; created?: string }>;
}) {
  const [{ id }, queryParams] = await Promise.all([params, searchParams]);
  const { supabase } = await requireManager("attendance.manage");
  const search = normalizeSearch(queryParams.q);
  const statusFilter = STATUS_FILTERS.includes(queryParams.status as (typeof STATUS_FILTERS)[number])
    ? queryParams.status as (typeof STATUS_FILTERS)[number]
    : "all";
  const requestedPage = parsePage(queryParams.page);
  const sessionResult = await supabase.from("meeting_attendance_sessions")
    .select("id, name, meeting_date, meeting_time, venue, scope, club_id, notes, created_at, clubs(name)")
    .eq("id", id)
    .maybeSingle();

  if (sessionResult.error || !sessionResult.data) notFound();
  const session = sessionResult.data;
  const club = session.clubs && !Array.isArray(session.clubs) ? session.clubs : null;
  const baseCount = () => supabase.from("meeting_attendance")
    .select("user_id", { count: "exact", head: true })
    .eq("session_id", session.id);
  const [allCount, presentCount, absentCount, excusedCount, unmarkedCount] = await Promise.all([
    baseCount(),
    baseCount().eq("status", "present"),
    baseCount().eq("status", "absent"),
    baseCount().eq("status", "excused"),
    baseCount().eq("status", "unmarked"),
  ]);

  let rosterQuery = supabase.from("meeting_attendance")
    .select("session_id, user_id, member_name, status, marked_by, marked_at", { count: "exact" })
    .eq("session_id", session.id)
    .order("status", { ascending: true })
    .order("member_name", { ascending: true })
    .order("user_id", { ascending: true });
  if (search) rosterQuery = rosterQuery.ilike("member_name", "%" + escapeSearch(search) + "%");
  if (statusFilter !== "all") rosterQuery = rosterQuery.eq("status", statusFilter);
  const total = allCount.count ?? 0;
  const filteredCountQuery = supabase.from("meeting_attendance")
    .select("user_id", { count: "exact", head: true })
    .eq("session_id", session.id);
  let filteredCount = filteredCountQuery;
  if (search) filteredCount = filteredCount.ilike("member_name", "%" + escapeSearch(search) + "%");
  if (statusFilter !== "all") filteredCount = filteredCount.eq("status", statusFilter);
  const filteredResult = await filteredCount;
  const filteredTotal = filteredResult.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const { data: roster, error: rosterError } = await rosterQuery.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = roster ?? [];
  const start = filteredTotal === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filteredTotal);
  const pageHref = (nextPage: number) => attendanceHref(session.id, search, statusFilter, nextPage);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/manage/attendance" className="text-sm font-medium text-sky-700 hover:underline">← Attendance sheets</Link>
      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">{session.scope === "society" ? "Society meeting" : club?.name ?? "Club meeting"}</p>
          <h1 className="mt-2 text-3xl font-bold">{session.name}</h1>
          <p className="mt-2 text-sm text-muted">{formatMeetingDate(session.meeting_date, session.meeting_time)}{session.venue ? " · " + session.venue : ""}</p>
          {session.notes && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted">{session.notes}</p>}
        </div>
        <a href={"/manage/attendance/" + session.id + "/export"} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold hover:border-sky-500 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900">Export full attendance CSV</a>
      </header>

      {queryParams.created === "1" && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">The sheet starts with every active member in this scope. Choose Present, Absent, or Excused for people this meeting applies to. Leave everyone else as “Not in meeting”; those names appear at the end of the export.</p>}

      <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Attendance totals">
        <Summary label="Roster" value={total} tone="sky" />
        <Summary label="Present" value={presentCount.count ?? 0} tone="emerald" />
        <Summary label="Absent" value={absentCount.count ?? 0} tone="rose" />
        <Summary label="Excused" value={excusedCount.count ?? 0} tone="amber" />
        <Summary label="Not in meeting" value={unmarkedCount.count ?? 0} tone="slate" />
      </section>

      <section className="mt-8" aria-labelledby="roster-title">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="roster-title" className="text-xl font-semibold">Member attendance</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">All active members are listed automatically. “Not in meeting” means the meeting does not apply to that person; use Present, Absent, or Excused only for people included in this meeting.</p>
            <p className="mt-1 text-sm text-muted">{rosterError ? "Roster unavailable" : "Showing " + start + "–" + end + " of " + filteredTotal.toLocaleString() + " filtered members · " + PAGE_SIZE + " per page"}</p>
          </div>
          <form action={"/manage/attendance/" + session.id} method="get" role="search" className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto] lg:max-w-2xl">
            <label className="sr-only" htmlFor="attendance-search">Search members</label>
            <input id="attendance-search" name="q" type="search" maxLength={80} defaultValue={search} placeholder="Search by member name" className="min-h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950" />
            <label>
              <span className="sr-only">Filter attendance status</span>
              <select name="status" defaultValue={statusFilter} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option value="all">All statuses</option>
                <option value="unmarked">Not in meeting</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="excused">Excused</option>
              </select>
            </label>
            <button type="submit" className="min-h-11 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800">Apply</button>
          </form>
        </div>

        {rosterError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">Could not load this attendance roster. Refresh and check the meeting scope permissions.</p>}
        {!rosterError && (
          <>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Member</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Mark attendance</th>
                    <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">Last marked (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((member) => (
                    <tr key={member.user_id} className="align-top hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <th scope="row" className="px-4 py-3 font-medium">{member.member_name}</th>
                      <td className="px-4 py-3">
                        <AttendanceStatusPicker sessionId={session.id} userId={member.user_id} memberName={member.member_name} initialStatus={member.status as AttendanceStatus} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{member.marked_at ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(member.marked_at)) : "—"}</td>
                    </tr>
                  ))}
                  {!rows.length && <tr><td colSpan={3} className="px-4 py-10 text-center text-muted">{search || statusFilter !== "all" ? "No members match these filters." : "No active members were present in this scope when the sheet was created."}</td></tr>}
                </tbody>
              </table>
            </div>

            <nav aria-label="Attendance member pages" className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">Page {page} of {pageCount}</p>
              <div className="flex gap-2">
                {page > 1
                  ? <Link rel="prev" href={pageHref(page - 1)} className={pageButtonClass}>← Previous</Link>
                  : <span aria-disabled="true" className={pageButtonClass + " cursor-not-allowed opacity-50"}>← Previous</span>}
                {page < pageCount
                  ? <Link rel="next" href={pageHref(page + 1)} className={pageButtonClass}>Next →</Link>
                  : <span aria-disabled="true" className={pageButtonClass + " cursor-not-allowed opacity-50"}>Next →</span>}
              </div>
            </nav>
          </>
        )}
      </section>
    </main>
  );
}

function Summary({ label, value, tone }: { label: string; value: number; tone: string }) {
  const styles: Record<string, string> = {
    sky: "border-sky-100 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    rose: "border-rose-100 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100",
    amber: "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
    slate: "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
  };
  return <div className={`rounded-2xl border p-4 ${styles[tone] ?? styles.slate}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums">{value.toLocaleString()}</p></div>;
}

function normalizeSearch(value: string | undefined) {
  return (value ?? "").replace(/[%_]/g, " ").trim().replace(/\s+/g, " ").slice(0, 80);
}

function escapeSearch(value: string) {
  return value.replace(/[%,()]/g, " ").trim();
}

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 1_000_000) : 1;
}

function attendanceHref(id: string, search: string, status: string, page: number) {
  const query = new URLSearchParams();
  if (search) query.set("q", search);
  if (status !== "all") query.set("status", status);
  query.set("page", String(page));
  return "/manage/attendance/" + id + "?" + query.toString();
}

function formatMeetingDate(value: string, time: string | null) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (Number.isNaN(date.valueOf())) return "Date unavailable";
  const label = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "Asia/Kolkata" }).format(date);
  return label + (time ? " · " + time.slice(0, 5) : "");
}

const pageButtonClass = "inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold hover:border-sky-500 hover:text-sky-700 dark:border-slate-700";
