import type { Json } from "@/types/database";

export type ClubTrack = { title: string; description: string };
export type ClubSession = { title: string; description: string };
export type Club = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  shortDescription: string;
  purposeTitle: string;
  purposeDescription: string;
  heroImage: string;
  galleryImage: string;
  sessionImage: string;
  promoVideo?: string;
  tracks: ClubTrack[];
  whatYouDo: string[];
  sessions: ClubSession[];
  contact: { linkedin?: string; instagram?: string; whatsapp?: string };
  logoUrl: string;
  homepageImage: string;
  homepageSubtitle: string;
  homepageBadge: string;
  focusAreas: string[];
};

function record(value: Json): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function objectList<T extends { title: string; description: string }>(value: Json): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const title = entry.title;
    const description = entry.description;
    return typeof title === "string" && typeof description === "string"
      ? [{ title, description } as T]
      : [];
  });
}

export function mapClub(row: {
  id: string; slug: string; name: string; tagline: string | null; description: string | null;
  purpose_title: string | null; purpose_description: string | null; hero_image_url: string | null;
  gallery_image_url: string | null; session_image_url: string | null; promo_video_url: string | null;
  tracks: Json; activities: string[]; sessions: Json; contact_links: Json; logo_url: string | null;
  homepage_image_url: string | null; homepage_subtitle: string | null; homepage_badge: string | null;
  focus_areas: string[];
}): Club {
  const contacts = record(row.contact_links) ?? {};
  const text = (value: Json | undefined) => typeof value === "string" ? value : undefined;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? "",
    shortDescription: row.description ?? "",
    purposeTitle: row.purpose_title ?? "About this club",
    purposeDescription: row.purpose_description ?? row.description ?? "",
    heroImage: row.hero_image_url ?? row.logo_url ?? "/clubs/default.jpg",
    galleryImage: row.gallery_image_url ?? row.hero_image_url ?? row.logo_url ?? "/clubs/default.jpg",
    sessionImage: row.session_image_url ?? row.gallery_image_url ?? row.logo_url ?? "/clubs/default.jpg",
    promoVideo: row.promo_video_url ?? undefined,
    tracks: objectList<ClubTrack>(row.tracks),
    whatYouDo: row.activities,
    sessions: objectList<ClubSession>(row.sessions),
    contact: {
      linkedin: text(contacts.linkedin),
      instagram: text(contacts.instagram),
      whatsapp: text(contacts.whatsapp),
    },
    logoUrl: row.logo_url ?? row.hero_image_url ?? "/clubs/default.jpg",
    homepageImage: row.homepage_image_url ?? row.hero_image_url ?? row.logo_url ?? "/clubs/default.jpg",
    homepageSubtitle: row.homepage_subtitle ?? row.tagline ?? "",
    homepageBadge: row.homepage_badge ?? "",
    focusAreas: row.focus_areas,
  };
}
