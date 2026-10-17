import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import ResultMessage from "@/components/manage/ResultMessage";
import AdminDataTable, { type AdminDataColumn, type AdminDataRow } from "@/components/manage/AdminDataTable";
import { requireManager } from "@/lib/manage/server";
import { publishNotification } from "./actions";

export const metadata: Metadata = { title: "Notifications & updates | Techtronica management" };
const columns: AdminDataColumn[] = [
  { key: "title", label: "Update" },
  { key: "kind", label: "Type" },
  { key: "audience", label: "Audience" },
  { key: "published", label: "Published" },
  { key: "destination", label: "Destination", defaultVisible: false },
];

export default async function ManageNotificationsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { result } = await searchParams;
  const { supabase } = await requireManager("content.manage");
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, message, href, audience, published_at")
    .order("published_at", { ascending: false })
    .limit(50);

  const rows: AdminDataRow[] = (data ?? []).map((notice) => {
    const values = {
      title: notice.title,
      kind: notice.kind,
      audience: notice.audience === "everyone" ? "All signed-in users" : "Society members",
      published: formatDate(notice.published_at),
      destination: notice.href,
    };
    return {
      id: notice.id,
      values,
      cells: values,
      searchText: [values.title, values.kind, values.audience, notice.message, values.destination].join(" "),
      card: <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><h3 className="font-semibold">{notice.title}</h3><p className="mt-1 text-xs capitalize text-slate-500">{notice.kind} · {values.audience} · {values.published}</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{notice.message}</p><Link href={notice.href} className="mt-2 inline-block text-sm font-medium text-sky-700 underline">{notice.href}</Link></article>,
    };
  });

  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <Link href="/manage" className="text-sm font-semibold text-sky-700 underline">← Management</Link>
    <h1 className="mt-4 text-3xl font-bold">Notifications & updates</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Newly published events notify users automatically. Post deployment notes, version releases, and society updates here; the notice appears in the signed-in notification bell immediately.</p>
    <ResultMessage result={result} />

    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.14em] text-sky-700">Publish an update</p><h2 className="mt-1 text-xl font-semibold">Share a release or deployment</h2><p className="mt-1 text-sm text-muted">This publishes immediately. Add a version number in the title for release notes, such as “Version 1.2.0 is live”.</p></div>
      <form action={publishNotification} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Update type"><select name="kind" defaultValue="deployment" className={inputClass}><option value="deployment">Deployment</option><option value="release">Version release</option><option value="announcement">General announcement</option></select></Field>
        <Field label="Who can see this"><select name="audience" defaultValue="everyone" className={inputClass}><option value="everyone">All signed-in users</option><option value="society_members">Society members only</option></select></Field>
        <div className="md:col-span-2"><Field label="Title"><input name="title" required minLength={1} maxLength={160} placeholder="Version 1.2.0 is live" className={inputClass} /></Field></div>
        <div className="md:col-span-2"><Field label="Message"><textarea name="message" required minLength={1} maxLength={1200} rows={4} placeholder="Tell users what changed or what is new." className={inputClass} /></Field></div>
        <div className="md:col-span-2"><Field label="Internal destination"><input name="href" required maxLength={2048} defaultValue="/events" placeholder="/events" className={inputClass} /></Field><p className="mt-1 text-xs text-muted">Use a path on this website, for example /events or /about. External URLs are not accepted.</p></div>
        <div className="md:col-span-2"><button type="submit" className="min-h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700">Publish notification</button></div>
      </form>
    </section>

    <section className="mt-9">
      <h2 className="text-xl font-semibold">Recent notifications <span className="text-sm font-normal text-muted">({data?.length ?? 0})</span></h2>
      <p className="mt-1 text-sm text-muted">Event notifications are generated when an event is first published. Use the table controls to search, sort, switch views, choose columns, and export the recent list.</p>
      {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Notifications could not be loaded.</p> : <AdminDataTable id="manage-notifications" columns={columns} rows={rows} emptyMessage="No notifications have been published yet." />}
    </section>
  </main>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium">{label}<span className="mt-1.5 block">{children}</span></label>;
}
const inputClass = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-950";
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
