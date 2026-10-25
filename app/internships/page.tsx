import type { Metadata } from "next";
import InternshipDirectory from "@/components/internships/InternshipDirectory";
import { getPublicInternshipCompanies, getPublicInternships } from "@/lib/data/internships";
import { parseInternshipFilters } from "@/lib/internships/core.mjs";

export const metadata: Metadata = {
  title: "Internships and career opportunities | Techtronica",
  description: "Browse technology internships discovered from major employers, with direct links to official company career pages.",
  alternates: { canonical: "/internships" },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function InternshipsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value) params.set(key, value);
  }
  const filters = parseInternshipFilters(params);
  const [companyResult, listingResult] = await Promise.all([
    getPublicInternshipCompanies(),
    getPublicInternships(filters),
  ]);
  return <InternshipDirectory
    filters={filters}
    companies={companyResult.companies}
    listings={listingResult.listings}
    nextCursor={listingResult.nextCursor}
    error={listingResult.error}
    companyError={companyResult.error}
  />;
}
