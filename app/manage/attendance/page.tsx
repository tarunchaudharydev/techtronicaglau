import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminDataTable from "@/components/manage/AdminDataTable";
import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import ResultMessage from "@/components/manage/ResultMessage";
import { requireManager } from "@/lib/manage/server";
import { createMeetingAttendance } from "./actions";

export const metadata: Metadata = { title: "Meeting attendance | Techtronica management" };

export default async function MeetingAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { result } = await searchParams;
  const { supabase } = await requireManager("attendance.manage");
  const [sessionResult, clubsResult] = await Promise.all([
    supabase.from("meeting_attendance_sessions")
      .select("id, name, meeting_date, meeting_time, venue, scope, club_id, notes, created_at, clubs(name)")
      .order("meeting_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("clubs").select("id, name, is_active").eq("is_active", true).order("display_order").limit(20),
  ]);
  const sessions = sessionResult.data ?? [];
  const clubs = clubsResult.data ?? [];
  const rows = sessions.map((session) => {
    const club = session.clubs && !Array.isArray(session.clubs) ? session.clubs : null;
    const values = {
      meeting: session.name,
      date: formatDate(session.meeting_date, session.meeting_time),
      scope: session.scope === "society" ? "Society" : club?.name ?? "Club",
      venue: session.venue ?? "—",
    };
    return {
      id: session.id,
      values,
      cells: values,
      searchText: Object.values(values).join(" "),
      actions: <Link href={"/manage/attendance/" + session.id} className="font-semibold text-sky-700 underline underline-offset-2">Take attendance</Link>,
      card: (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-semibold">{session.name}</h3>
          <p className="mt-1 text-sm text-muted">{values.date} · {values.scope} · {values.venue}</p>
          <Link href={"/manage/attendance/" + session.id} className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800">Open attendance sheet</Link>
        </article>
      ),
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/manage" className="text-sm font-medium text-sky-700 hover:underline">← Management</Link>
      <header className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">People & operations</p>
        <h1 className="mt-2 text-3xl font-bold">Meeting attendance</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Create a named attendance sheet for each meeting. A society sheet starts with all active society members; a club sheet starts with all active members of that club. “Not in meeting” means that person is not included in this meeting.</p>
      </header>

      <ResultMessage result={result} />

      <section id="create-meeting" className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="text-xl font-semibold">Create an attendance sheet</h2>
        <p className="mt-1 text-sm text-muted">The active member list is added automatically and saved as a snapshot. Mark people as Present, Absent, or Excused when the meeting applies to them; leave everyone else as Not in meeting. Later membership changes do not rewrite this sheet.</p>
        <form action={createMeetingAttendance} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Meeting name">
            <input name="name" required minLength={2} maxLength={120} placeholder="Society meeting 1" className={inputClass} />
          </Field>
          <Field label="Meeting date">
            <input name="meeting_date" type="date" required defaultValue={todayInIndia()} className={inputClass} />
          </Field>
          <Field label="Meeting time (optional)">
            <input name="meeting_time" type="time" className={inputClass} />
          </Field>
          <Field label="Meeting scope">
            <select name="scope" defaultValue="society" className={inputClass}>
              <option value="society">Society meeting</option>
              <option value="club">Club meeting</option>
            </select>
          </Field>
          <Field label="Club (required for a club meeting)">
            <select name="club_id" defaultValue="" className={inputClass}>
              <option value="">Choose a club</option>
              {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
            </select>
          </Field>
          <Field label="Venue (optional)">
            <input name="venue" maxLength={240} placeholder="Room or online meeting link" className={inputClass} />
          </Field>
          <Field label="Notes (optional)">
            <textarea name="notes" maxLength={2000} rows={2} className={inputClass} />
          </Field>
          <div className="flex items-end">
            <PendingSubmitButton type="submit" className={buttonClass}>Create sheet and add active members</PendingSubmitButton>
          </div>
        </form>
      </section>

      <section className="mt-9" aria-labelledby="sheets-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="sheets-heading" className="text-xl font-semibold">Attendance sheets</h2>
            <p className="mt-1 text-sm text-muted">Recent meetings, newest first{sessions.length === 100 ? " · showing the latest 100" : ""}.</p>
          </div>
        </div>
        {(sessionResult.error || clubsResult.error) && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">Attendance sheets could not be loaded. Refresh the page or check your assigned scope.</p>}
        {!sessionResult.error && !clubsResult.error && <AdminDataTable id="manage-meeting-attendance" columns={columns} rows={rows} emptyMessage="No attendance sheets yet. Create one for your next meeting." />}
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium">{label}{children}</label>;
}

function formatDate(value: string, time: string | null) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (Number.isNaN(date.valueOf())) return "Date unavailable";
  const label = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(date);
  return label + (time ? " · " + time.slice(0, 5) : "");
}

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

const columns = [
  { key: "meeting", label: "Meeting" },
  { key: "date", label: "Date" },
  { key: "scope", label: "Scope" },
  { key: "venue", label: "Venue" },
];

const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const buttonClass = "min-h-11 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
