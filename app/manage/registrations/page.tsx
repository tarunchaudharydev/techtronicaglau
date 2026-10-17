import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import type { Metadata } from "next";
import Link from "next/link";
import ResultMessage from "@/components/manage/ResultMessage";
import AdminDataTable, { type AdminDataColumn, type AdminDataRow } from "@/components/manage/AdminDataTable";
import { requireManager, validId } from "@/lib/manage/server";
import { updateRegistrationStatus } from "./actions";

export const metadata: Metadata = { title: "Event registrations | Techtronica management" };
const pageSize = 25;
type RegistrationStatus = "registered" | "waitlisted" | "attended" | "no_show" | "cancelled";

const registrationColumns: AdminDataColumn[] = [
  { key: "member", label: "Registrant" },
  { key: "event", label: "Event" },
  { key: "status", label: "Status" },
  { key: "registered", label: "Registered at" },
  { key: "team_size", label: "Team size" },
  { key: "team", label: "Team member details" },
  { key: "notes", label: "Notes", defaultVisible: false },
];

export default async function ManageRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string; event?: string; result?: string }>;
}) {
  const params = await searchParams;
  const cursor = parseCursor(params.before);
  const selectedEventId = validId(params.event ?? null) ? params.event! : null;
  const { supabase } = await requireManager("registrations.manage");

  const [eventResult, registrationResult, totalResult, registeredResult, waitlistedResult, attendedResult] = await Promise.all([
    supabase.from("events").select("id, title, starts_at, status").order("starts_at", { ascending: false }).limit(250),
    loadRegistrations(supabase, selectedEventId, cursor),
    countRegistrations(supabase, selectedEventId),
    countRegistrations(supabase, selectedEventId, "registered"),
    countRegistrations(supabase, selectedEventId, "waitlisted"),
    countRegistrations(supabase, selectedEventId, "attended"),
  ]);

  const events = eventResult.data ?? [];
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const data = registrationResult.data;
  const error = registrationResult.error;
  const rows = data?.slice(0, pageSize) ?? [];
  const hasMore = (data?.length ?? 0) > pageSize;
  const last = rows.at(-1);
  const nextCursor = hasMore && last ? `${last.registered_at}|${last.id}` : null;

  const tableRows: AdminDataRow[] = !error ? rows.map((row) => {
    const event = one(row.events);
    const profile = one(row.profiles);
    const member = profile?.full_name || "Member";
    const eventTitle = event?.title || "Event";
    const status = row.status.replaceAll("_", " ");
    const registered = formatDate(row.registered_at);
    const team = [...(row.event_registration_members ?? [])].sort((a, b) => a.member_order - b.member_order);
    const teamSummary = team.length
      ? team.map((person, index) => `${index + 1}. ${person.full_name} · ${person.email} · Year ${person.year_of_study} · ${person.branch} · Section ${person.section}`).join("; ")
      : "No team details (legacy registration)";
    const teamCell = team.length ? (
      <details className="min-w-48 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
        <summary className="cursor-pointer font-medium">{team.length} {team.length === 1 ? "member" : "members"} · View details</summary>
        <ul className="mt-2 grid gap-2">
          {team.map((person) => (
            <li key={person.member_order} className="rounded-lg bg-slate-50 p-2 text-xs leading-5 dark:bg-slate-950">
              <strong>{person.member_order}. {person.full_name}</strong><br />
              {person.email}<br />
              Year {person.year_of_study} · {person.branch} · Section {person.section}
            </li>
          ))}
        </ul>
      </details>
    ) : "No team details";
    const canUpdate = row.status === "registered" || row.status === "waitlisted";
    const action = canUpdate ? <form action={updateRegistrationStatus} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={row.id} />
      <input type="hidden" name="current_status" value={row.status} />
      {selectedEventId && <input type="hidden" name="event_id" value={selectedEventId} />}
      <label className="text-xs font-medium">Set status
        <select name="status" defaultValue={row.status === "registered" ? "attended" : "cancelled"} className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
          {row.status === "registered" && <><option value="attended">Attended</option><option value="no_show">No show</option></>}
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <PendingSubmitButton type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">Save</PendingSubmitButton>
    </form> : null;

    const values = {
      member,
      event: eventTitle,
      status,
      registered,
      team_size: team.length || "—",
      team: teamSummary,
      notes: row.notes ?? "—",
    };
    return {
      id: row.id,
      searchText: Object.values(values).join(" "),
      values,
      cells: { ...values, team: teamCell },
      actions: action,
      card: <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center dark:border-slate-800 dark:bg-slate-900">
        <div><h2 className="font-semibold">{member}</h2><p className="mt-1 text-sm text-muted">{eventTitle} · <span className="capitalize">{status}</span></p><p className="mt-1 text-xs text-muted">Registered {registered}</p>{team.length > 0 && <section className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><h3 className="text-sm font-semibold">Team details ({team.length})</h3><ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">{team.map((person) => <li key={person.member_order} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><strong>{person.member_order}. {person.full_name}</strong><div className="text-muted">{person.email} · Year {person.year_of_study} · {person.branch} · Section {person.section}</div></li>)}</ul></section>}{row.notes && <p className="mt-2 text-sm">{row.notes}</p>}</div>
        {action}
      </article>,
    };
  }) : [];

  const tableId = `manage-registrations-${selectedEventId ?? "all"}`;
  const stats = [
    { label: "Total applications", count: totalResult.count ?? 0, color: "text-slate-950 dark:text-white" },
    { label: "Registered", count: registeredResult.count ?? 0, color: "text-sky-700 dark:text-sky-300" },
    { label: "Waitlisted", count: waitlistedResult.count ?? 0, color: "text-amber-700 dark:text-amber-300" },
    { label: "Attended", count: attendedResult.count ?? 0, color: "text-emerald-700 dark:text-emerald-300" },
  ];

  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <Link href="/manage" className="text-sm font-medium text-sky-700 hover:underline">← Management</Link>
    <h1 className="mt-4 text-3xl font-bold">Event registrations</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Review attendee and team details event by event. Search, sort, choose columns and views, and export the currently filtered registrations. Access remains limited by your database permissions.</p>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex sm:items-end sm:justify-between sm:gap-5 sm:p-5">
      <form action="/manage/registrations" method="get" className="flex w-full flex-col gap-3 sm:max-w-2xl sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-semibold" htmlFor="registration-event-filter">
          Filter by event
          <select id="registration-event-filter" name="event" defaultValue={selectedEventId ?? ""} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-700 dark:bg-slate-950">
            <option value="">All events</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title} · {formatDate(event.starts_at)} · {event.status}</option>)}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700">Show registrations</button>
        {selectedEventId && <Link href="/manage/registrations" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700">Clear filter</Link>}
      </form>
      {selectedEvent && <p className="mt-3 text-sm text-muted sm:mt-0">Viewing <strong className="text-slate-900 dark:text-white">{selectedEvent.title}</strong></p>}
    </section>

    {eventResult.error && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">The event selector could not be loaded; you can still review registrations visible in your assigned scope.</p>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-muted">{stat.label}</p><p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.count.toLocaleString("en-IN")}</p></article>)}
    </div>

    <ResultMessage result={params.result} />
    {error && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">The registration list could not be loaded. Refresh and check your assigned scope.</p>}
    {!error && <AdminDataTable id={tableId} columns={registrationColumns} rows={tableRows} emptyMessage={selectedEventId ? "No registrations found for this event in your assigned scope." : "No registrations are visible in your assigned scope."} />}
    {nextCursor && <Link className="mt-6 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-sky-500" href={registrationUrl(selectedEventId, nextCursor)}>Next 25 registrations →</Link>}
  </main>;
}

function loadRegistrations(supabase: Awaited<ReturnType<typeof requireManager>>["supabase"], eventId: string | null, cursor: { registeredAt: string; id: string } | null) {
  let query = supabase
    .from("event_registrations")
    .select("id, event_id, user_id, status, registered_at, notes, events!event_registrations_event_id_fkey!inner(title), profiles!event_registrations_user_id_fkey!inner(full_name), event_registration_members(full_name,email,year_of_study,branch,section,member_order)", { count: "exact" })
    .order("registered_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  if (eventId) query = query.eq("event_id", eventId);
  if (cursor) query = query.or(`registered_at.lt.${cursor.registeredAt},and(registered_at.eq.${cursor.registeredAt},id.lt.${cursor.id})`);
  return query;
}

function countRegistrations(
  supabase: Awaited<ReturnType<typeof requireManager>>["supabase"],
  eventId: string | null,
  status?: RegistrationStatus,
) {
  let query = supabase.from("event_registrations").select("id", { count: "exact", head: true });
  if (eventId) query = query.eq("event_id", eventId);
  if (status) query = query.eq("status", status);
  return query;
}

function registrationUrl(eventId: string | null, before: string) {
  const params = new URLSearchParams({ before });
  if (eventId) params.set("event", eventId);
  return `/manage/registrations?${params.toString()}`;
}

function one<T>(value: T | T[] | null) { return Array.isArray(value) ? value[0] ?? null : value; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date); }
function parseCursor(value?: string) {
  if (!value || value.length > 120) return null;
  const [dateValue, id, ...extra] = value.split("|");
  if (extra.length || !id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
  const date = new Date(dateValue);
  return Number.isNaN(date.valueOf()) ? null : { registeredAt: date.toISOString(), id };
}
