import type { Metadata } from "next";
import EventsList from "@/components/events/EventsList";
import { getVisibleEvents } from "@/lib/data/public-content";
import { mapDatabaseEvent } from "@/lib/data/event-mappers";

export const metadata: Metadata = { title: "Events | Techtronica Society", description: "Explore workshops, hackathons, and events hosted by Techtronica Society." };

export default async function EventsPage() {
  const rows = await getVisibleEvents();
  // This is a request-rendered Server Component; the current time is an input to the upcoming/past partition.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const events = (rows ?? []).map(mapDatabaseEvent);
  const upcoming = events.filter((event) => new Date(event.startsAt).valueOf() >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = events.filter((event) => new Date(event.startsAt).valueOf() < now).sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return <main className="text-center"><EventsList upcoming={upcoming} past={past} /></main>;
}
