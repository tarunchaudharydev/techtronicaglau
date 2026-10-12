import EventPopup from "@/components/features/events/EventPopup";
import { mapDatabaseEvent } from "@/lib/data/event-mappers";
import { getPublicEvents } from "@/lib/data/public-content";

export default async function EventPopupLoader() {
  const publicEvents = await getPublicEvents();
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const nextEvent = [...(publicEvents ?? [])]
    .filter((event) => new Date(event.starts_at).valueOf() > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];

  return nextEvent ? <EventPopup event={mapDatabaseEvent(nextEvent)} /> : null;
}
