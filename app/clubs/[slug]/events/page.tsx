import { notFound } from "next/navigation";
import EventsList from "@/components/events/EventsList";
import { eventClubSlug, mapDatabaseEvent } from "@/lib/data/event-mappers";
import { getPublicClubBySlug, getVisibleEvents } from "@/lib/data/public-content";

export default async function ClubEventsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getPublicClubBySlug(slug);
  if (!club) notFound();
  const rows = await getVisibleEvents();
  const events = (rows ?? []).filter((row) => eventClubSlug(row) === slug).map(mapDatabaseEvent);
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const upcoming = events.filter((event) => new Date(event.startsAt).valueOf() >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = events.filter((event) => new Date(event.startsAt).valueOf() < now).sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return (
    <main className="max-w-6xl mx-auto px-4 py-20 space-y-14">
      <h1 className="text-3xl font-bold text-center">{club.name} Events</h1>
      <EventsList upcoming={upcoming} past={past} eventPathPrefix={`/clubs/${slug}/events`} />
    </main>
  );
}
