"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BellRing, BriefcaseBusiness, CalendarDays, ClipboardCheck, ContactRound, GraduationCap, Inbox, Layers3, Network, Search, ShieldCheck, Sparkles, TicketCheck, UserPlus, UsersRound } from "lucide-react";
type DirectorySection = { title: string; href: string; description: string };
export type ManagementDirectoryGroup = { name: string; number: string; description: string; sections: DirectorySection[] };
const icons: Record<string, typeof UsersRound> = {
  "/manage/memberships": UsersRound, "/manage/team": Network, "/manage/alumni": GraduationCap,
  "/manage/access": ShieldCheck, "/manage/users": UserPlus, "/manage/clubs": Layers3,
  "/manage/positions": ContactRound, "/manage/events": CalendarDays, "/manage/attendance": ClipboardCheck,
  "/manage/registrations": TicketCheck, "/manage/contacts": Inbox, "/manage/content": Sparkles, "/manage/notifications": BellRing,
  "/manage/internships": BriefcaseBusiness,
};
const tints = ["bg-blue-50 text-blue-700", "bg-emerald-50 text-emerald-700", "bg-amber-50 text-amber-800", "bg-violet-50 text-violet-700"];
export default function ManagementAreaDirectory({ groups }: { groups: ManagementDirectoryGroup[] }) {
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All tools");
  const groupNames = useMemo(() => ["All tools", ...groups.map(({ name }) => name)], [groups]);
  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return groups.filter(({ name }) => selectedGroup === "All tools" || selectedGroup === name)
      .map((group) => ({ ...group, sections: group.sections.filter(({ title, description, href }) =>
        !normalized || (title + " " + description + " " + href + " " + group.name).toLocaleLowerCase().includes(normalized),
      ) })).filter(({ sections }) => sections.length > 0);
  }, [groups, query, selectedGroup]);
  const resultCount = filteredGroups.reduce((total, group) => total + group.sections.length, 0);
  return (
    <section aria-labelledby="management-tools-title" className="mt-5 scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Workspace</p><h2 id="management-tools-title" className="mt-1 text-lg font-bold text-slate-950 sm:text-xl">Management tools</h2><p className="mt-1 text-sm text-slate-600">Find the right place to manage society work.</p></div>
          <p aria-live="polite" className="text-xs font-medium text-slate-500">{resultCount} {resultCount === 1 ? "tool" : "tools"}</p>
        </div>
        <div className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100">
          <Search aria-hidden="true" className="size-4 shrink-0 text-slate-500" />
          <label className="sr-only" htmlFor="management-tools-search">Search management tools</label>
          <input id="management-tools-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools" className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500" />
          {query && <button type="button" onClick={() => setQuery("")} className="rounded-md px-2 py-1 text-xs font-semibold text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">Clear</button>}
        </div>
        <div aria-label="Filter management tools by category" role="group" className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {groupNames.map((name) => <button key={name} type="button" aria-pressed={selectedGroup === name} onClick={() => setSelectedGroup(name)} className={"min-h-10 shrink-0 rounded-full border px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 " + (selectedGroup === name ? "border-sky-700 bg-sky-700 text-white" : "border-slate-300 bg-white text-slate-700")}>{name}</button>)}
        </div>
        <div className="mt-4 space-y-5">
          {filteredGroups.map(({ name, number, description, sections }) => <div key={name}>
            <div className="mb-2 flex items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">{name}</h3><span className="text-xs text-slate-500">{sections.length}</span><p className="hidden text-xs text-slate-500 sm:block">{description}</p></div>
            <div className="grid gap-2 min-[480px]:grid-cols-2 xl:grid-cols-3">
              {sections.map((section, index) => { const Icon = icons[section.href] ?? ArrowUpRight; return <Link key={section.href} href={section.href} className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                <span className={"grid size-9 shrink-0 place-items-center rounded-lg " + tints[(index + Number(number)) % tints.length]}><Icon aria-hidden="true" className="size-[18px]" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-5 text-slate-900">{section.title}</span><span className="mt-0.5 line-clamp-2 block text-xs leading-4 text-slate-600">{section.description}</span></span><ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
              </Link>; })}
            </div>
          </div>)}
          {filteredGroups.length === 0 && <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">No tools match “{query}”. Try another search.</p>}
        </div>
      </div>
    </section>
  );
}
