import type { Tables } from "@/types/database";
import { createPublicClient } from "@/lib/supabase/public";
import {
  decodeInternshipCursor,
  encodeInternshipCursor,
  type InternshipFilters,
} from "@/lib/internships/core.mjs";

export type InternshipListing = Tables<"internships">;
export type InternshipCompany = Pick<Tables<"internship_companies">, "id" | "name">;
const pageSize = 20;
const publicColumns = "id, company_id, company_name, title, description, technical_categories, skills, country_code, city, location_label, work_arrangement, degree_requirements, eligible_years, application_url, official_source_url, source_name, posted_at, deadline, listing_status, verification_status, verified_at, verification_due_at, published_at, created_at, updated_at";

export async function getPublicInternshipCompanies() {
  const supabase = createPublicClient();
  if (!supabase) return { companies: [] as InternshipCompany[], error: "unavailable" as const };
  const { data, error } = await supabase
    .from("internship_companies")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(100);
  if (error) {
    console.error("Public internship companies query failed", { code: error.code });
    return { companies: [] as InternshipCompany[], error: "query" as const };
  }
  return { companies: data ?? [], error: null };
}

export async function getPublicInternships(filters: InternshipFilters) {
  const supabase = createPublicClient();
  if (!supabase) return { listings: [] as InternshipListing[], nextCursor: null, error: "unavailable" as const };

  let query = supabase
    .from("internships")
    .select(publicColumns)
    .eq("listing_status", "open")
    .eq("verification_status", "verified");

  if (filters.query) query = query.textSearch("search_document", filters.query, { type: "websearch", config: "simple" });
  if (filters.category) query = query.contains("technical_categories", [filters.category]);
  if (filters.companyId) query = query.eq("company_id", filters.companyId);
  if (filters.citySearch) query = query.eq("city_search", filters.citySearch);
  if (filters.countryCode) query = query.eq("country_code", filters.countryCode);
  if (filters.arrangement) query = query.eq("work_arrangement", filters.arrangement);
  if (filters.degree) query = query.contains("degree_requirements", [filters.degree]);
  if (filters.year) query = query.contains("eligible_years", [filters.year]);

  const now = new Date();
  if (filters.deadlineWindow === "none") {
    query = query.is("deadline", null);
  } else if (filters.deadlineWindow) {
    const cutoff = new Date(now.valueOf() + Number(filters.deadlineWindow) * 24 * 60 * 60 * 1000);
    query = query.gt("deadline", now.toISOString()).lte("deadline", cutoff.toISOString());
  }

  const cursor = decodeInternshipCursor(filters.cursor, filters.sort);
  if (cursor) {
    const key = cursor.key;
    if (filters.sort === "deadline") {
      query = key === null
        ? query.or(`and(deadline.is.null,id.gt.${cursor.id})`)
        : query.or(`deadline.gt.${key},and(deadline.eq.${key},id.gt.${cursor.id}),deadline.is.null`);
    } else if (filters.sort === "newest") {
      query = key === null
        ? query.or(`and(posted_at.is.null,id.lt.${cursor.id})`)
        : query.or(`posted_at.lt.${key},and(posted_at.eq.${key},id.lt.${cursor.id}),posted_at.is.null`);
    } else {
      query = query.or(`verified_at.lt.${key},and(verified_at.eq.${key},id.lt.${cursor.id})`);
    }
  }

  if (filters.sort === "deadline") {
    query = query.order("deadline", { ascending: true, nullsFirst: false }).order("id", { ascending: true });
  } else if (filters.sort === "newest") {
    query = query.order("posted_at", { ascending: false, nullsFirst: false }).order("id", { ascending: false });
  } else {
    query = query.order("verified_at", { ascending: false }).order("id", { ascending: false });
  }

  const { data, error } = await query.limit(pageSize + 1);
  if (error) {
    console.error("Public internship search failed", { code: error.code });
    return { listings: [] as InternshipListing[], nextCursor: null, error: "query" as const };
  }

  const hasMore = (data?.length ?? 0) > pageSize;
  const listings = (data ?? []).slice(0, pageSize) as InternshipListing[];
  const last = listings.at(-1);
  const cursorKey = last
    ? filters.sort === "deadline" ? last.deadline
      : filters.sort === "newest" ? last.posted_at
        : last.verified_at
    : null;
  const nextCursor = hasMore && last
    ? encodeInternshipCursor(filters.sort, cursorKey, last.id)
    : null;

  return { listings, nextCursor, error: null };
}

export async function getPublicInternshipById(id: string) {
  const supabase = createPublicClient();
  if (!supabase) return { listing: null, error: "unavailable" as const };
  const { data, error } = await supabase
    .from("internships")
    .select(publicColumns)
    .eq("id", id)
    .eq("listing_status", "open")
    .eq("verification_status", "verified")
    .maybeSingle();
  if (error) {
    console.error("Public internship detail query failed", { code: error.code });
    return { listing: null, error: "query" as const };
  }
  return { listing: data as InternshipListing | null, error: null };
}
