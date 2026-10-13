import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import Image from "next/image";
import Link from "next/link";
import type { Tables } from "@/types/database";
import ResultMessage from "@/components/manage/ResultMessage";
import { cancelEventRegistration, registerForEvent } from "@/app/events/actions";

type EventRecord = Pick<Tables<"events">, "id" | "slug" | "title" | "summary" | "description" | "event_type" | "venue" | "starts_at" | "ends_at" | "registration_opens_at" | "registration_closes_at" | "capacity" | "cover_image_url">;
type Registration = { id: string; status: string } | null;

export default function DatabaseEventDetails({ event, registration, result, backHref = "/events", backLabel = "All events" }: { event: EventRecord & { clubs: { name: string } | { name: string }[] | null }; registration: Registration; result?: string; backHref?: string; backLabel?: string }) {
  // This is a request-rendered Server Component; database writes recheck the event window.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const starts = new Date(event.starts_at).valueOf();
  const windowOpen = (!event.registration_opens_at || new Date(event.registration_opens_at).valueOf() <= now) && (!event.registration_closes_at || new Date(event.registration_closes_at).valueOf() >= now) && starts >= now;
  const canCancel = registration && ["registered", "waitlisted"].includes(registration.status);
  const club = Array.isArray(event.clubs) ? event.clubs[0]?.name : event.clubs?.name;
  return <main className="min-h-screen bg-sky-50/50 px-4 pb-20 pt-32 dark:bg-slate-950">
    <div className="mx-auto mb-6 max-w-6xl"><Link href={backHref} className="text-sm font-semibold text-sky-700 hover:underline">← {backLabel}</Link></div>
    <article className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(260px,380px)_1fr]">
      <aside className="space-y-4"><div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100 shadow-lg dark:bg-slate-900"><Image src={event.cover_image_url || "/events/event5.jpg"} alt={event.title} fill priority sizes="(max-width: 1024px) 100vw, 380px" className="object-cover" /></div><p className="rounded-xl bg-white p-4 text-sm shadow-sm dark:bg-slate-900"><span className="block text-xs text-muted">Hosted by</span><span className="mt-1 block font-semibold">{club || "Techtronica Society"}</span></p></aside>
      <div className="space-y-6"><header><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{event.title}</h1>{event.summary && <p className="mt-3 text-base text-muted">{event.summary}</p>}<div className="mt-5 space-y-2 text-sm"><p><strong>When:</strong> {formatDate(event.starts_at)}{event.ends_at ? ` – ${formatDate(event.ends_at)}` : ""} (UTC)</p><p><strong>Where:</strong> {event.venue || "Location to be announced"}</p><p><strong>Type:</strong> {event.event_type || "Society event"}</p>{event.capacity && <p><strong>Capacity:</strong> {event.capacity}</p>}</div></header>
        <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="text-xl font-semibold">Event registration</h2><p className="mt-2 text-sm text-muted">Seat allocation and the waitlist are handled by the database, so repeated or simultaneous submissions cannot overbook capacity.</p>
          <ResultMessage result={result} />
          {result === "waitlisted" && <p className="mt-2 text-sm text-muted">We will move you into a seat when one becomes available.</p>}
          {registration && <p className="mt-3 text-sm font-semibold">Your current status: {registration.status.replaceAll("_", " ")}</p>}
          {canCancel ? <form action={cancelEventRegistration} className="mt-4"><input type="hidden" name="registration_id" value={registration.id} /><input type="hidden" name="slug" value={event.slug} /><PendingSubmitButton type="submit" className="rounded-full border border-rose-300 px-5 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-50">Cancel registration</PendingSubmitButton></form>
            : !registration && windowOpen ? <form action={registerForEvent} className="mt-4"><input type="hidden" name="event_id" value={event.id} /><input type="hidden" name="slug" value={event.slug} /><PendingSubmitButton type="submit" className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">Register for this event</PendingSubmitButton></form>
            : !registration && <p className="mt-4 text-sm font-semibold text-muted">Registration is closed.</p>}
        </section>
        {event.description && <section className="space-y-3 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900"><h2 className="text-xl font-semibold">About this event</h2>{event.description.split(/\n+/).filter(Boolean).map((line, index) => <p key={index} className="text-sm leading-7 text-muted">{line}</p>)}</section>}
      </div>
    </article>
  </main>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value)); }
