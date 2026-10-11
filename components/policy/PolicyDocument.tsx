import type { Json } from "@/types/database";
import { getPublicSiteContentBySlug } from "@/lib/data/public-content";
import { contentObject, contentText } from "@/lib/data/content-fields";

export default async function PolicyDocument({ slug, title }: { slug: string; title: string }) {
  const record = await getPublicSiteContentBySlug("policy_document", slug);
  const content = contentObject(record?.content ?? {});
  const sections = objectList(content.sections);
  return <main className="mx-auto min-h-[65vh] max-w-5xl px-4 py-16 sm:px-6">
    <header className="mb-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Techtronica Society</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{record?.title ?? title}</h1>
      {contentText(content.intro) && <p className="mt-5 max-w-3xl text-sm leading-7 text-muted">{contentText(content.intro)}</p>}
      {(contentText(content.effective_date) || contentText(content.last_updated)) && <p className="mt-4 text-xs text-muted">{contentText(content.effective_date) && `Effective ${contentText(content.effective_date)}`}{contentText(content.effective_date) && contentText(content.last_updated) ? " · " : ""}{contentText(content.last_updated) && `Updated ${contentText(content.last_updated)}`}</p>}
    </header>
    {!record ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted dark:border-slate-800 dark:bg-slate-900">This document has not been published yet.</p> :
      <div className="grid gap-5 sm:grid-cols-2">
        {sections.map((section, index) => {
          const heading = contentText(section.title);
          const body = contentText(section.body);
          const points = stringList(section.points);
          return <section key={`${heading}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">{heading}</h2>
            {body && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{body}</p>}
            {points.length > 0 && <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">{points.map((point, pointIndex) => <li key={`${pointIndex}-${point.slice(0, 18)}`}>{point}</li>)}</ul>}
          </section>;
        })}
      </div>}
    {contentText(content.contact) && <p className="mt-10 rounded-xl bg-slate-100 p-5 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-200">{contentText(content.contact)}</p>}
  </main>;
}

function objectList(value: Json | undefined) {
  return Array.isArray(value) ? value.flatMap((entry) => entry && typeof entry === "object" && !Array.isArray(entry) ? [entry] : []) : [];
}

function stringList(value: Json | undefined) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}
