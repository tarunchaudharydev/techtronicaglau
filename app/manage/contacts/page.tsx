import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { getMyPermissionKeys } from "@/lib/auth/permissions";
import { updateContactStatus } from "./actions";
import AdminDataTable from "@/components/manage/AdminDataTable";

export const metadata: Metadata = { title: "Contact inbox | Techtronica" };
const pageSize = 25;
const statusOptions = ["new", "in_progress", "resolved", "spam"] as const;
const contactColumns = [
  { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "club", label: "Scope" },
  { key: "status", label: "Status" }, { key: "received", label: "Received" },
  { key: "topic", label: "Topic", defaultVisible: false }, { key: "message", label: "Message", defaultVisible: false },
];

export default async function ManageContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string; status?: string; result?: string }>;
}) {
  const params = await searchParams;
  const status = statusOptions.find((item) => item === params.status);
  const cursor = parseCursor(params.before);
  const supabase = await createClient();
  if (!supabase) return <Unavailable />;

  const appUser = await getCurrentAppUser();
  const userId = appUser?.id ?? "";
  if (!userId) redirect("/auth/sign-in?next=/manage/contacts");

  const { permissionKeys, error: permissionError } = await getMyPermissionKeys(supabase, userId);
  if (!permissionKeys.has("contacts.manage") && !permissionKeys.has("admin.manage") && !permissionError) {
    return <NoAccess />;
  }

  let query = supabase
    .from("contact_submissions")
    .select("id, club_id, name, email, topic, message, status, created_at, clubs(name, slug)")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  if (status) query = query.eq("status", status);
  if (cursor) query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);

  const { data, error } = await query;
  const submissions = data?.slice(0, pageSize) ?? [];
  const hasMore = (data?.length ?? 0) > pageSize;
  const last = submissions.at(-1);
  const nextCursor = hasMore && last ? `${last.created_at}|${last.id}` : null;
  const tableRows = !error ? submissions.map((submission) => {
    const club = one(submission.clubs);
    const values = {
      name: submission.name,
      email: submission.email,
      club: club?.name ?? "Society-wide",
      status: formatStatus(submission.status),
      received: formatDate(submission.created_at),
      topic: submission.topic ?? "—",
      message: submission.message,
    };
    const action = <form action={updateContactStatus} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={submission.id} /><input type="hidden" name="current_status" value={submission.status} />
      <label className="sr-only" htmlFor={`contact-status-${submission.id}`}>Update status for {submission.name}</label>
      <select id={`contact-status-${submission.id}`} name="status" defaultValue={submission.status} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
        {statusOptions.map((option) => <option key={option} value={option}>{formatStatus(option)}</option>)}
      </select>
      <PendingSubmitButton className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800" type="submit">Save status</PendingSubmitButton>
    </form>;
    return {
      id: submission.id,
      searchText: Object.values(values).join(" "),
      values,
      cells: values,
      actions: action,
      card: <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{submission.name}</h2>
          <a className="mt-1 block text-sm text-sky-700 hover:underline" href={`mailto:${encodeURIComponent(submission.email)}`}>{submission.email}</a>
          <p className="mt-1 text-xs text-muted">{values.club} · {values.received}</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">{values.status}</span></div>
        {submission.topic && <p className="mt-4 text-sm font-medium">{submission.topic}</p>}
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted">{submission.message}</p>
        <div className="mt-5">{action}</div>
      </article>,
    };
  }) : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link className="text-sm font-medium text-sky-700 hover:underline" href="/manage">← Management</Link>
      <h1 className="mt-4 text-3xl font-bold">Contact inbox</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">Messages are private and visible only to managers with the matching society or club permission.</p>

      {params.result === "saved" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">Message status updated.</p>}
      {params.result === "error" && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">The message changed or could not be updated. Refresh and try again.</p>}
      {permissionError && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">We could not verify your current permissions. Refresh to retry.</p>}

      <nav aria-label="Filter contact messages" className="mt-6 flex flex-wrap gap-2 text-sm">
        <FilterLink status="" current={status ?? ""}>All</FilterLink>
        {statusOptions.map((option) => <FilterLink key={option} status={option} current={status ?? ""}>{formatStatus(option)}</FilterLink>)}
      </nav>

      {error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">The inbox could not be loaded. Refresh and retry.</p>}
      {!error && <AdminDataTable id="manage-contacts" columns={contactColumns} rows={tableRows} emptyMessage="No messages match this filter in your assigned scope." />}

      {nextCursor && <Link className="mt-6 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-sky-500" href={`/manage/contacts?${status ? `status=${status}&` : ""}before=${encodeURIComponent(nextCursor)}`}>Next 25 messages →</Link>}
    </main>
  );
}

function FilterLink({ status, current, children }: { status: string; current: string; children: React.ReactNode }) {
  const href = status ? `/manage/contacts?status=${status}` : "/manage/contacts";
  return <Link href={href} aria-current={status === current ? "page" : undefined} className={`rounded-lg border px-3 py-2 ${status === current ? "border-sky-600 bg-sky-50 text-sky-800" : "border-slate-200 hover:border-sky-400 dark:border-slate-700"}`}>{children}</Link>;
}
function one<T>(value: T | T[] | null) { return Array.isArray(value) ? value[0] ?? null : value; }
function formatStatus(status: string) { return status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date); }
function parseCursor(value?: string) {
  if (!value || value.length > 120) return null;
  const [dateValue, id, ...extra] = value.split("|");
  if (extra.length || !id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const date = new Date(dateValue);
  return Number.isNaN(date.valueOf()) ? null : { createdAt: date.toISOString(), id };
}
function NoAccess() { return <main className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Access not assigned</h1><p className="mt-3 text-sm text-muted">You do not have the contacts.manage capability in a society or club scope.</p><Link className="mt-6 inline-block text-sky-700 underline" href="/manage">Return to management</Link></main>; }
function Unavailable({ message = "Connect Supabase to review contact messages." }: { message?: string }) { return <main className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Contact management unavailable</h1><p className="mt-3 text-sm text-muted">{message}</p><Link className="mt-6 inline-block text-sky-700 underline" href="/account">Return to your account</Link></main>; }
