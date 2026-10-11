"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SiteContentRow } from "@/lib/data/public-content";
import { contentObject, contentText } from "@/lib/data/content-fields";
import { FiSearch, FiFileText } from "react-icons/fi";

export default function ResourceDirectory({ resources }: { resources: SiteContentRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => resources.filter((resource) => {
    const content = contentObject(resource.content);
    return `${resource.title} ${contentText(content.subject)} ${contentText(content.category)} ${contentText(content.year)}`.toLowerCase().includes(query.toLowerCase());
  }), [query, resources]);

  return <main className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
    <div className="mb-10"><h1 className="text-3xl font-extrabold text-foreground dark:text-white mb-2">Academics & Resources</h1><p className="text-muted">Search and access notes, previous year questions, and learning resources.</p></div>
    <div className="relative mb-8 max-w-md"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" placeholder="Search by subject, year, or title..." value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500" /></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((resource) => {
      const content = contentObject(resource.content);
      return <Link key={resource.id} href={`/academics/${resource.slug}`} className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900"><div className="flex items-start gap-3"><FiFileText className="mt-1 text-sky-600" /><div><h2 className="font-semibold text-foreground dark:text-white group-hover:text-sky-600">{resource.title}</h2><p className="mt-1 text-xs text-muted">{contentText(content.subject)} • {contentText(content.year)}</p><span className="mt-2 inline-block rounded-full bg-sky-100 px-3 py-1 text-[11px] font-medium text-sky-700">{contentText(content.category)}</span></div></div></Link>;
    })}</div>
    {!filtered.length && <p className="mt-6 text-sm text-muted">No matching resources are published.</p>}
  </main>;
}
