import type { Tables } from "@/types/database";

type EventRow = Pick<
  Tables<"events">,
  | "id"
  | "slug"
  | "title"
  | "summary"
  | "description"
  | "venue"
  | "starts_at"
  | "registration_closes_at"
  | "cover_image_url"
> & {
  clubs: { name: string; slug?: string } | { name: string; slug?: string }[] | null;
};

export type EventSummary = {
  id: string;
  slug: string;
  title: string;
  club: string;
  date: string;
  time: string;
  startsAt: string;
  location: string;
  coverImage: string;
  description: string;
  registrationDeadline?: string;
};

export function mapDatabaseEvent(row: EventRow): EventSummary {
  const startsAt = new Date(row.starts_at);
  const club = Array.isArray(row.clubs) ? row.clubs[0]?.name : row.clubs?.name;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    club: club || "Techtronica Society",
    date: new Intl.DateTimeFormat("en-IN", {
      dateStyle: "long",
      timeZone: "Asia/Kolkata",
    }).format(startsAt),
    time: new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(startsAt),
    startsAt: row.starts_at,
    location: row.venue || "Location to be announced",
    coverImage: row.cover_image_url || "/events/event5.jpg",
    description: row.summary || row.description || "",
    registrationDeadline: row.registration_closes_at || undefined,
  };
}

export function eventClubSlug(row: EventRow): string | null {
  const club = Array.isArray(row.clubs) ? row.clubs[0] : row.clubs;
  return club?.slug ?? null;
}
