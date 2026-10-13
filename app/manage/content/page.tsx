import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Tables } from "@/types/database";
import { requireManager } from "@/lib/manage/server";
import { siteContentTypes, type SiteContentType } from "@/lib/data/public-content";
import ResultMessage from "@/components/manage/ResultMessage";
import { createContentRecord, deleteContentRecord, updateContentRecord } from "./actions";
import StorageImageUpload from "@/components/manage/StorageImageUpload";

export const metadata: Metadata = { title: "Website content | Techtronica management" };
const labels: Record<SiteContentType, string> = {
  home_about: "Homepage introduction", home_stat: "Homepage statistics", home_feature: "Homepage features",
  home_slide: "Homepage slides", sponsor: "Sponsors and partners", faq: "FAQs",
  learning_resource: "Academic resources", project: "Projects", research_work: "Research and patents",
  gallery_image: "Gallery images", library_folder: "Library categories", about_section: "About sections",
  mission_vision_value: "Mission, vision, and values", policy_document: "Policy documents",
};

export default async function ManageContentPage({ searchParams }: { searchParams: Promise<{ result?: string; type?: string }> }) {
  const { result, type: requestedType } = await searchParams;
  const type = siteContentTypes.includes(requestedType as SiteContentType) ? requestedType as SiteContentType : null;
  const { supabase } = await requireManager("content.manage");
  let query = supabase.from("site_content").select("id, content_type, slug, title, content, display_order, is_public, is_active, created_at, updated_at, created_by, updated_by").order("content_type").order("display_order").order("title").limit(100);
  if (type) query = query.eq("content_type", type);
  const { data, error } = await query;
  const records = (data ?? []) as Tables<"site_content">[];
  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <Link href="/manage" className="text-sm font-medium text-sky-700 hover:underline">← Management</Link>
    <h1 className="mt-4 text-3xl font-bold">Website content</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Manage editable website records in Supabase. Public and active records appear on the site; drafts remain visible only to authorized content managers. Structured fields are stored as JSON and validated before saving.</p>
    <ResultMessage result={result} />
    {error && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">Could not load content. Refresh and check your content permissions.</p>}
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter content type">
      <Link href="/manage/content" className={`rounded-full border px-3 py-1.5 text-xs ${!type ? "border-sky-600 bg-sky-50 text-sky-800" : "border-slate-300"}`}>All</Link>
      {siteContentTypes.map((contentType) => <Link key={contentType} href={`/manage/content?type=${contentType}`} className={`rounded-full border px-3 py-1.5 text-xs ${type === contentType ? "border-sky-600 bg-sky-50 text-sky-800" : "border-slate-300"}`}>{labels[contentType]}</Link>)}
    </nav>
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold">Add a content record</h2>
      <ContentForm action={createContentRecord} initialType={type ?? "faq"} />
    </section>
    <section className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">Records <span className="text-sm font-normal text-muted">({records.length}{records.length === 100 ? "+" : ""})</span></h2>
      {records.map((record) => <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-3 text-sm font-semibold">{record.title} <span className="font-normal text-muted">· {labels[record.content_type as SiteContentType]} · {record.is_public ? "Public" : "Private"} · {record.is_active ? "Active" : "Inactive"}</span></p>
        <ContentForm action={updateContentRecord} record={record} />
        <form action={deleteContentRecord} className="mt-3"><input type="hidden" name="id" value={record.id} /><PendingSubmitButton type="submit" className="text-sm font-medium text-rose-700 underline">Delete record</PendingSubmitButton></form>
      </article>)}
      {!records.length && !error && <p className="rounded-xl border border-slate-200 p-5 text-sm text-muted">No matching content records found. Add one above.</p>}
    </section>
  </main>;
}

type RecordRow = Tables<"site_content">;
function ContentForm({ action, record, initialType }: { action: (formData: FormData) => void | Promise<void>; record?: RecordRow; initialType?: SiteContentType }) {
  const value = JSON.stringify(record?.content ?? defaultPayload(initialType ?? "faq"), null, 2);
  return <form action={action} className="mt-4 grid gap-4 md:grid-cols-2">
    {record && <input type="hidden" name="id" value={record.id} />}
    <Field label="Content type"><select name="content_type" defaultValue={record?.content_type ?? initialType ?? "faq"} className={inputClass}>{siteContentTypes.map((contentType) => <option key={contentType} value={contentType}>{labels[contentType]}</option>)}</select></Field>
    <Field label="URL slug"><input name="slug" required maxLength={120} defaultValue={record?.slug ?? ""} className={inputClass} placeholder="example-record" /></Field>
    <Field label="Title"><input name="title" required maxLength={200} defaultValue={record?.title ?? ""} className={inputClass} /></Field>
    <Field label="Display order"><input name="display_order" type="number" min="-9999" max="9999" defaultValue={record?.display_order ?? 0} className={inputClass} /></Field>
    <Field label="Content JSON (see examples below)"><textarea name="content" required maxLength={65536} rows={12} defaultValue={value} className={`${inputClass} font-mono text-xs md:col-span-2`} /></Field>
    <div className="md:col-span-2"><StorageImageUpload name="uploaded_asset_url" folder="content" folderScopeField="content_type" label="Upload one public image for this record" /></div>
    <div className="flex flex-wrap gap-5 md:col-span-2"><label className="flex items-center gap-2 text-sm"><input name="is_public" type="checkbox" defaultChecked={record?.is_public ?? true} /> Public</label><label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={record?.is_active ?? true} /> Active</label></div>
    <PendingSubmitButton className={buttonClass} type="submit">{record ? "Save record" : "Add record"}</PendingSubmitButton>
  </form>;
}

function defaultPayload(type: SiteContentType) {
  const examples: Record<SiteContentType, object> = {
    home_about: { description: ["Introduction paragraph"], image: "/homeImages/team_image.JPG" },
    home_stat: { value: "5 Clubs", label: "Clubs", description: "Society clubs" },
    home_feature: { title: "Feature title", p1: "Paragraph one", p2: "Paragraph two", image: "/homeImages/example.jpg", alt: "Description" },
    home_slide: { club_slug: "technovation", subtitle: "Hands-on learning", badge: "Workshops", image: "/clubs/technovation/images/pcb.jpg" },
    sponsor: { logo_url: "/sponsors/example.png", link_url: "" },
    faq: { question: "Question", answer: "Answer" },
    learning_resource: { subject: "Electronics", category: "Notes", year: "2nd Year", file_url: "/notes/example.pdf" },
    project: { short_description: "Summary", description: [], working: [], domains: [], status: "completed", year: 2026, cover_image: "", images: [], credits: [], repo_url: "", demo_url: "" },
    research_work: { kind: "research", domain: "Electronics", year: 2026, description: "", document_url: "" },
    gallery_image: { image_url: "https://example.com/image.jpg", alt: "Gallery image" },
    library_folder: { subtitle: "Resources", href: "/academics", color: "blue" },
    about_section: { heading: "Who We Are", paragraphs: ["About paragraph"], image_url: "/ourTeam/group.JPG" },
    mission_vision_value: { label: "Our Mission", text: "Mission statement" },
    policy_document: { sections: [{ title: "Section", body: "Policy text" }] },
  };
  return examples[type];
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="text-sm font-medium">{label}{children}</label>; }
const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const buttonClass = "rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
