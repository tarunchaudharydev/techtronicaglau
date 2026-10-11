import Image from "next/image";
import type { SiteContentRow } from "@/lib/data/public-content";
import { contentList, contentObject, contentText } from "@/lib/data/content-fields";

export default function ContentListing({ title, description, records, emptyMessage }: {
  title: string;
  description: string;
  records: SiteContentRow[];
  emptyMessage: string;
}) {
  return <main className="mx-auto min-h-[65vh] max-w-6xl px-4 py-16 sm:px-6">
    <header className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Techtronica Society</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 text-sm leading-6 text-muted sm:text-base">{description}</p>
    </header>
    {records.length === 0 ? <p className="mx-auto mt-12 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-muted dark:border-slate-800 dark:bg-slate-900">{emptyMessage}</p> :
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((record) => {
          const content = contentObject(record.content);
          const image = contentText(content.cover_image, contentText(content.image_url, contentText(content.image)));
          const summary = contentText(content.short_description, contentText(content.description));
          const metadata = [contentText(content.domain), contentText(content.year), contentText(content.status)].filter(Boolean);
          const domains = contentList(content.domains);
          const href = safeExternalUrl(contentText(content.document_url, contentText(content.repo_url, contentText(content.demo_url))));
          const safeImage = safeImageSource(image);
          return <article key={record.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {safeImage && <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800"><Image src={safeImage} alt={contentText(content.alt, record.title)} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /></div>}
            <div className="p-5">
              <h2 className="text-lg font-semibold">{record.title}</h2>
              {metadata.length > 0 && <p className="mt-1 text-xs font-medium uppercase tracking-wide text-sky-700">{metadata.join(" · ")}</p>}
              {domains.length > 0 && <p className="mt-2 text-xs text-muted">{domains.join(" · ")}</p>}
              {summary && <p className="mt-3 line-clamp-5 text-sm leading-6 text-muted">{summary}</p>}
              {href && <a href={href} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:underline">Open details ↗</a>}
            </div>
          </article>;
        })}
      </div>}
  </main>;
}

function safeImageSource(value: string) {
  return (value.startsWith("/") && !value.startsWith("//")) || value.startsWith("https://erivblclxwtonwysgdle.supabase.co/storage/v1/object/public/")
    ? value
    : null;
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
