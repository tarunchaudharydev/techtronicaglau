import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import type { Metadata } from "next";
import Link from "next/link";
import ResultMessage from "@/components/manage/ResultMessage";
import AdminDataTable, { type AdminDataColumn, type AdminDataRow } from "@/components/manage/AdminDataTable";
import { requireManager } from "@/lib/manage/server";
import { updateRegistrationStatus } from "./actions";

export const metadata: Metadata = { title: "Event registrations | Techtronica management" };
const pageSize = 25;
const registrationColumns: AdminDataColumn[] = [
  { key: "member", label: "Member" },
  { key: "event", label: "Event" },
  { key: "status", label: "Status" },
  { key: "registered", label: "Registered" },
  { key: "notes", label: "Notes", defaultVisible: false },
];

export default async function ManageRegistrationsPage({ searchParams }: { searchParams: Promise<{ before?: string; result?: string }> }) {
  const params = await searchParams;
  const cursor = parseCursor(params.before);
  const { supabase } = await requireManager("registrations.manage");
  let query = supabase
    .from("event_registrations")
    .select("id, event_id, user_id, status, registered_at, notes, events!event_registrations_event_id_fkey!inner(title), profiles!event_registrations_user_id_fkey!inner(full_name)")
    .order("registered_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  if (cursor) query = query.or(`registered_at.lt.${cursor.registeredAt},and(registered_at.eq.${cursor.registeredAt},id.lt.${cursor.id})`);
  const { data, error } = await query;
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
    const canUpdate = row.status === "registered" || row.status === "waitlisted";
    const action = canUpdate ? <form action={updateRegistrationStatus} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={row.id} />
      <input type="hidden" name="current_status" value={row.status} />
      <label className="text-xs font-medium">Set status
        <select name="status" defaultValue={row.status === "registered" ? "attended" : "cancelled"} className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
          {row.status === "registered" && <><option value="attended">Attended</option><option value="no_show">No show</option></>}
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <PendingSubmitButton type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">Save</PendingSubmitButton>
    </form> : null;
    const values = { member, event: eventTitle, status, registered, notes: row.notes ?? "—" };
    return {
      id: row.id,
      searchText: Object.values(values).join(" "),
      values,
      cells: values,
      actions: action,
      card: <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center dark:border-slate-800 dark:bg-slate-900">
        <div><h2 className="font-semibold">{member}</h2><p className="mt-1 text-sm text-muted">{eventTitle} · <span className="capitalize">{status}</span></p><p className="mt-1 text-xs text-muted">Registered {registered}</p>{row.notes && <p className="mt-2 text-sm">{row.notes}</p>}</div>
        {action}
      </article>,
    };
  }) : [];

  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <Link href="/manage" className="text-sm font-medium text-sky-700 hover:underline">← Management</Link>
    <h1 className="mt-4 text-3xl font-bold">Event registrations</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Registrations are paged in groups of 25 and filtered by your database permissions. Cancelled seats may promote the next waitlisted member automatically.</p>
    <ResultMessage result={params.result} />
    {error && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">The registration list could not be loaded. Refresh and check your assigned scope.</p>}
    {!error && <AdminDataTable id="manage-registrations" columns={registrationColumns} rows={tableRows} emptyMessage="No registrations are visible in your assigned scope." />}
    {nextCursor && <Link className="mt-6 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-sky-500" href={`/manage/registrations?before=${encodeURIComponent(nextCursor)}`}>Next 25 registrations →</Link>}
  </main>;
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
