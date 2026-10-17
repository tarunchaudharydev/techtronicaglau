import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import ResultMessage from "@/components/manage/ResultMessage";
import { requireManager } from "@/lib/manage/server";
import { createEvent, deleteEvent, updateEvent } from "./actions";
import StorageImageUpload from "@/components/manage/StorageImageUpload";
import AdminDataTable from "@/components/manage/AdminDataTable";

export const metadata: Metadata = { title: "Events | Techtronica management" };

export default async function ManageEventsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { result } = await searchParams;
  const { supabase } = await requireManager("events.manage");
  const [eventResult, clubResult] = await Promise.all([
    supabase.from("events").select("id, title, slug, summary, description, event_type, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, capacity, min_team_members, max_team_members, cover_image_url, status, club_id, is_public, clubs(name)").order("starts_at", { ascending: false }).limit(100),
    supabase.from("clubs").select("id, name, slug").eq("is_active", true).order("display_order").limit(20),
  ]);
  const events = eventResult.data ?? [];
  const clubs = clubResult.data ?? [];
  const eventColumns = [
    { key: "title", label: "Event" },
    { key: "club", label: "Club" },
    { key: "type", label: "Type" },
    { key: "starts", label: "Starts" },
    { key: "status", label: "Status" },
    { key: "visibility", label: "Visibility" },
  ];
  const tableRows = events.map((event) => {
    const clubName = event.clubs && !Array.isArray(event.clubs) ? event.clubs.name : "Society-wide";
    const values = {
      title: event.title,
      club: clubName,
      type: event.event_type ?? "—",
      starts: formatDate(event.starts_at),
      status: event.status,
      visibility: event.is_public ? "Public" : "Members only",
    };
    return {
      id: event.id,
      values,
      cells: values,
      searchText: Object.values(values).join(" "),
      actions: <a href={"#manage-event-" + event.id} className="font-semibold text-sky-700 underline underline-offset-2">Edit</a>,
      card: (
        <article id={"manage-event-" + event.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold">{event.title}</span>
            <span className="text-muted">{event.slug} · {clubName} · {event.is_public ? "Public" : "Members only"}</span>
          </div>
          <form action={updateEvent} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={event.id} />
            <Field label="Title"><input name="title" required maxLength={160} defaultValue={event.title} className={inputClass} /></Field>
            <Field label="URL slug"><input name="slug" required maxLength={100} defaultValue={event.slug} className={inputClass} /></Field>
            <Field label="Hosting club"><select name="club_id" defaultValue={event.club_id ?? ""} className={inputClass}><option value="">Society-wide event</option>{clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></Field>
            <Field label="Type"><input name="event_type" maxLength={80} defaultValue={event.event_type ?? ""} className={inputClass} /></Field>
            <Field label="Venue"><input name="venue" maxLength={240} defaultValue={event.venue ?? ""} className={inputClass} /></Field>
            <Field label="Starts at (India time · IST)"><input name="starts_at" type="datetime-local" required defaultValue={toDateTimeLocal(event.starts_at)} className={inputClass} /></Field>
            <Field label="Ends at (India time · IST)"><input name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(event.ends_at)} className={inputClass} /></Field>
            <Field label="Capacity (blank means unlimited)"><input name="capacity" type="number" min="1" max="100000" defaultValue={event.capacity ?? ""} className={inputClass} /></Field>
            <Field label="Minimum team members (including you)"><input name="min_team_members" type="number" required min="1" max="50" defaultValue={event.min_team_members} className={inputClass} /></Field>
            <Field label="Maximum team members"><input name="max_team_members" type="number" required min="1" max="50" defaultValue={event.max_team_members} className={inputClass} /></Field>
            <Field label="Registration opens (India time · IST)"><input name="registration_opens_at" type="datetime-local" defaultValue={toDateTimeLocal(event.registration_opens_at)} className={inputClass} /></Field>
            <Field label="Registration closes (India time · IST)"><input name="registration_closes_at" type="datetime-local" defaultValue={toDateTimeLocal(event.registration_closes_at)} className={inputClass} /></Field>
            <Field label="Status"><select name="status" defaultValue={event.status} className={inputClass}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></Field>
            <Field label="Cover image URL"><input name="cover_image_url" type="url" maxLength={2048} defaultValue={event.cover_image_url ?? ""} className={inputClass} /></Field>
            <div><StorageImageUpload name="uploaded_asset_url" folder="events" folderScopeField="club_id" folderScopeOptions={Object.fromEntries(clubs.map((club) => [club.id, club.slug]))} label="Replace event image with one upload" /></div>
            <Field label="Short summary"><textarea name="summary" maxLength={500} rows={2} defaultValue={event.summary ?? ""} className={inputClass} /></Field>
            <Field label="Full description"><textarea name="description" maxLength={12000} rows={3} defaultValue={event.description ?? ""} className={inputClass} /></Field>
            <label className="flex items-center gap-2 text-sm"><input name="is_public" type="checkbox" defaultChecked={event.is_public} /> Public event <span className="text-muted">(unchecked means active members only)</span></label>
            <div><PendingSubmitButton type="submit" className={buttonClass}>Save event</PendingSubmitButton></div>
          </form>
          <form action={deleteEvent} className="mt-3"><input type="hidden" name="id" value={event.id} /><PendingSubmitButton type="submit" className="text-sm font-medium text-rose-700 underline">Delete event and its registrations</PendingSubmitButton></form>
        </article>
      ),
    };
  });

  return <main className="mx-auto max-w-6xl px-4 py-10">
    <Link href="/manage" className="text-sm font-semibold text-sky-700 underline">← Management</Link>
    <h1 className="mt-4 text-3xl font-bold">Events</h1>
    <p className="mt-2 max-w-3xl text-sm text-muted">Create and manage society and club events. Public events appear to everyone; private events are visible to active society members. All event and registration times are entered in India Standard Time (IST, UTC+05:30). A selected closing date and time remains open through that instant.</p>
    <ResultMessage result={result} />
    {(eventResult.error || clubResult.error) && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Events could not be loaded. Refresh the page or contact an administrator if the problem continues.</p>}
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold">Create an event</h2>
      <form action={createEvent} className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Title"><input name="title" required maxLength={160} className={inputClass} /></Field>
        <Field label="URL slug"><input name="slug" required maxLength={100} className={inputClass} /></Field>
        <Field label="Hosting club"><select name="club_id" defaultValue="" className={inputClass}><option value="">Society-wide event</option>{clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></Field>
        <Field label="Type"><input name="event_type" maxLength={80} className={inputClass} /></Field>
        <Field label="Venue"><input name="venue" maxLength={240} className={inputClass} /></Field>
        <Field label="Starts at (UTC)"><input name="starts_at" type="datetime-local" required className={inputClass} /></Field>
        <Field label="Ends at (UTC)"><input name="ends_at" type="datetime-local" className={inputClass} /></Field>
        <Field label="Capacity (blank means unlimited)"><input name="capacity" type="number" min="1" max="100000" className={inputClass} /></Field>
        <Field label="Minimum team members (including you)"><input name="min_team_members" type="number" required min="1" max="50" defaultValue="1" className={inputClass} /></Field>
        <Field label="Maximum team members"><input name="max_team_members" type="number" required min="1" max="50" defaultValue="5" className={inputClass} /></Field>
        <Field label="Registration opens (UTC)"><input name="registration_opens_at" type="datetime-local" className={inputClass} /></Field>
        <Field label="Registration closes (UTC)"><input name="registration_closes_at" type="datetime-local" className={inputClass} /></Field>
        <Field label="Status"><select name="status" defaultValue="draft" className={inputClass}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></Field>
        <Field label="Cover image URL"><input name="cover_image_url" type="url" maxLength={2048} className={inputClass} /></Field>
        <div><StorageImageUpload name="uploaded_asset_url" folder="events" folderScopeField="club_id" folderScopeOptions={Object.fromEntries(clubs.map((club) => [club.id, club.slug]))} label="Upload event image" /></div>
        <Field label="Short summary"><textarea name="summary" maxLength={500} rows={2} className={inputClass} /></Field>
        <Field label="Full description"><textarea name="description" maxLength={12000} rows={3} className={inputClass} /></Field>
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input name="is_public" type="checkbox" defaultChecked /> Public event <span className="text-muted">(uncheck for active society members only)</span></label>
        <div className="md:col-span-2"><PendingSubmitButton type="submit" className={buttonClass}>Create event</PendingSubmitButton></div>
      </form>
    </section>
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Existing events <span className="text-sm font-normal text-muted">({events.length}{events.length === 100 ? "+" : ""})</span></h2>
      {!eventResult.error && !clubResult.error && <AdminDataTable id="manage-events" columns={eventColumns} rows={tableRows} emptyMessage="No events found." />}
    </section>
  </main>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="text-sm font-medium">{label}{children}</label>; }
function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
  return parts.replace(" ", "T");
}
const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
function formatDate(value: string | null) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date); }
const buttonClass = "rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
