"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { EventSummary } from "@/lib/data/event-mappers";

export default function EventsList({ upcoming, past, eventPathPrefix = "/events" }: { upcoming: EventSummary[]; past: EventSummary[]; eventPathPrefix?: string }) {
  const [visiblePast, setVisiblePast] = useState(6);
  return <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6">
    <EventSection title="Upcoming events" events={upcoming} eventPathPrefix={eventPathPrefix} />
    <EventSection title="Past events" events={past.slice(0, visiblePast)} eventPathPrefix={eventPathPrefix} />
    {past.length > visiblePast && <div className="flex justify-center"><button onClick={() => setVisiblePast((n) => Math.min(n + 6, past.length))} className="rounded-lg bg-sky-600 px-6 py-3 font-medium text-white hover:bg-sky-700">Load more</button></div>}
    {!upcoming.length && !past.length && <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-muted dark:border-slate-800 dark:bg-slate-900">No events have been published yet.</p>}
  </div>;
}

function EventSection({ title, events, eventPathPrefix }: { title: string; events: EventSummary[]; eventPathPrefix: string }) {
  return <section><h2 className="mb-8 text-center text-3xl font-bold">{title}</h2>{events.length ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{events.map((event) => <article key={event.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900">
    <div className="relative h-48 w-full"><Image src={event.coverImage} alt={event.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></div>
    <div className="flex flex-1 flex-col space-y-2 p-4"><p className="text-xs font-medium text-sky-600">{event.club}</p><h3 className="text-lg font-semibold">{event.title}</h3><p className="text-sm text-muted">{event.date} · {event.time}</p>{event.description && <p className="line-clamp-3 text-sm text-muted">{event.description}</p>}<div className="mt-auto pt-4"><Link href={`${eventPathPrefix}/${event.slug}`} className="inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">Read more →</Link></div></div>
  </article>)}</div> : <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-muted dark:border-slate-800 dark:bg-slate-900">No {title.toLowerCase()} to show.</p>}</section>;
}
