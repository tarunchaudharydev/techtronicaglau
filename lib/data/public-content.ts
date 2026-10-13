import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

const publicContentTtlSeconds = 300;

export const siteContentTypes = [
  "home_about", "home_stat", "home_feature", "home_slide", "sponsor",
  "faq", "learning_resource", "project", "research_work", "gallery_image",
  "library_folder", "about_section", "mission_vision_value", "policy_document",
] as const;
export type SiteContentType = (typeof siteContentTypes)[number];
export type SiteContentRow = Tables<"site_content">;

export const getPublicSiteContent = unstable_cache(
  async (contentType: SiteContentType) => {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("site_content")
      .select("id, content_type, slug, title, content, display_order, is_public, is_active, created_at, updated_at, created_by, updated_by")
      .eq("content_type", contentType)
      .eq("is_active", true)
      .eq("is_public", true)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true })
      .limit(500);
    if (error) {
      console.error("Public site content query failed", { code: error.code, contentType });
      return null;
    }
    return data;
  },
  ["techtronica-public-site-content-v1"],
  { revalidate: publicContentTtlSeconds, tags: ["site-content"] },
);

export async function getPublicSiteContentBySlug(contentType: SiteContentType, slug: string) {
  const rows = await getPublicSiteContent(contentType);
  return rows?.find((row) => row.slug === slug) ?? null;
}

export type ClubContentRow = Pick<Tables<"clubs">,
  "id" | "name" | "slug" | "tagline" | "description" | "focus_areas" | "logo_url" | "is_active" | "display_order" |
  "purpose_title" | "purpose_description" | "hero_image_url" | "gallery_image_url" | "session_image_url" | "promo_video_url" |
  "tracks" | "activities" | "sessions" | "contact_links" | "homepage_image_url" | "homepage_subtitle" | "homepage_badge"
>;

export async function getPublicClubs() {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("clubs")
    .select("id, name, slug, tagline, description, focus_areas, logo_url, is_active, display_order, purpose_title, purpose_description, hero_image_url, gallery_image_url, session_image_url, promo_video_url, tracks, activities, sessions, contact_links, homepage_image_url, homepage_subtitle, homepage_badge")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(50);
  if (error) {
    console.error("Public clubs query failed", { code: error.code });
    return null;
  }
  return data;
}

export async function getHomepageCounts() {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const [clubs, events, team, alumni] = await Promise.all([
    supabase.from("clubs").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("is_public", true).in("status", ["published", "completed"]),
    supabase.from("team_members").select("id", { count: "exact", head: true }).eq("is_public", true).eq("is_active", true),
    supabase.from("alumni").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);
  if (clubs.error || events.error || team.error || alumni.error) {
    console.error("Homepage count query failed", { codes: [clubs.error?.code, events.error?.code, team.error?.code, alumni.error?.code] });
    return null;
  }
  return [
    { value: String(clubs.count ?? 0), label: "Active clubs", description: "Communities to explore" },
    { value: String(events.count ?? 0), label: "Public events", description: "Published society events" },
    { value: String(team.count ?? 0), label: "Team profiles", description: "Current public team" },
    { value: String(alumni.count ?? 0), label: "Alumni", description: "Published alumni stories" },
  ];
}

export const getPublicTeamMembers = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("team_members")
      .select(
        "id, display_name, title, member_type, roles, categories, summary, biography, avatar_url, linkedin_url, public_contact_url, birthday_month, birthday_day, club_id, display_order, is_public",
      )
      .eq("is_active", true)
      .eq("is_public", true)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true })
      .limit(200);

    if (error) {
      console.error("Public team directory query failed", { code: error.code });
      return null;
    }

    return data;
  },
  ["techtronica-public-team-v1"],
  { revalidate: publicContentTtlSeconds, tags: ["public-team"] },
);

/** User-specific RLS query: private entries are never placed in the shared cache. */
export async function getVisibleTeamMembers() {
  const supabase = await createClient();
  if (!supabase) return getPublicTeamMembers();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return getPublicTeamMembers();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, display_name, title, member_type, roles, categories, summary, biography, avatar_url, linkedin_url, public_contact_url, birthday_month, birthday_day, club_id, display_order, is_public")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("id", { ascending: true })
    .limit(200);
  if (error) {
    console.error("Visible team directory query failed", { code: error.code });
    return null;
  }
  if (!data?.length) return data;
  const privateRows = data.filter((row) => row.avatar_url?.startsWith("storage://member-media/"));
  if (!privateRows.length) return data;
  const paths = privateRows.map((row) => row.avatar_url!.slice("storage://member-media/".length));
  const { data: signedUrls, error: signingError } = await supabase.storage.from("member-media").createSignedUrls(paths, 600);
  if (signingError) {
    console.error("Private team media signing failed", { code: signingError.name });
    return data.map((row) => row.avatar_url?.startsWith("storage://member-media/") ? { ...row, avatar_url: null } : row);
  }
  const signedByPath = new Map((signedUrls ?? []).map((entry) => [entry.path, entry.signedUrl]));
  return data.map((row) => row.avatar_url?.startsWith("storage://member-media/")
    ? { ...row, avatar_url: signedByPath.get(row.avatar_url.slice("storage://member-media/".length)) ?? null }
    : row);
}

export const getPublicAlumni = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("alumni")
      .select(
        "id, display_name, cohort, society_role, avatar_url, linkedin_url, current_role, current_company, current_location, achievements, message, display_order, is_featured, club_id",
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("display_order", { ascending: true })
      .order("id", { ascending: true })
      .limit(200);

    if (error) {
      console.error("Public alumni directory query failed", { code: error.code });
      return null;
    }

    return data;
  },
  ["techtronica-public-alumni-v1"],
  { revalidate: publicContentTtlSeconds, tags: ["public-alumni"] },
);

export async function getPublicClubBySlug(slug: string) {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("clubs")
    .select("id, name, slug, tagline, description, focus_areas, logo_url, is_active, display_order, purpose_title, purpose_description, hero_image_url, gallery_image_url, session_image_url, promo_video_url, tracks, activities, sessions, contact_links, homepage_image_url, homepage_subtitle, homepage_badge")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Public club lookup failed", { code: error.code });
    return null;
  }

  return data;
}

export const getPublicEvents = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("events")
      .select(
        "id, slug, title, summary, description, event_type, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, capacity, cover_image_url, club_id, clubs(name, slug), is_public",
      )
      .eq("is_public", true)
      .in("status", ["published", "completed"])
      .order("starts_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Public events query failed", { code: error.code });
      return null;
    }

    return data;
  },
  ["techtronica-public-events-v1"],
  { revalidate: 60, tags: ["public-events"] },
);

/** Private event rows are fetched with the caller's cookie and are never shared between visitors. */
export async function getVisibleEvents() {
  const supabase = await createClient();
  if (!supabase) return getPublicEvents();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return getPublicEvents();
  const { data, error } = await supabase
    .from("events")
    .select("id, slug, title, summary, description, event_type, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, capacity, cover_image_url, club_id, clubs(name, slug), is_public")
    .in("status", ["published", "completed"])
    .order("starts_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);
  if (error) {
    console.error("Visible events query failed", { code: error.code });
    return null;
  }
  return data;
}

export async function getPublicEventBySlug(slug: string) {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, summary, description, event_type, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, capacity, cover_image_url, club_id, clubs(name, slug)",
    )
    .eq("is_public", true)
    .eq("slug", slug)
    .in("status", ["published", "completed"])
    .maybeSingle();

  if (error) {
    console.error("Public event lookup failed", { code: error.code });
    return null;
  }

  return data;
}

export async function getVisibleEventBySlug(slug: string) {
  const supabase = await createClient();
  if (!supabase) return getPublicEventBySlug(slug);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return getPublicEventBySlug(slug);
  const { data, error } = await supabase
    .from("events")
    .select("id, slug, title, summary, description, event_type, venue, starts_at, ends_at, registration_opens_at, registration_closes_at, capacity, cover_image_url, club_id, clubs(name, slug), is_public")
    .eq("slug", slug)
    .in("status", ["published", "completed"])
    .maybeSingle();
  if (error) {
    console.error("Visible event lookup failed", { code: error.code });
    return null;
  }
  return data;
}
