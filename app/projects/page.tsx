import type { Metadata } from "next";
import ContentListing from "@/components/content/ContentListing";
import { getPublicSiteContent } from "@/lib/data/public-content";

export const metadata: Metadata = { title: "Projects | Techtronica" };

export default async function ProjectsPage() {
  const records = await getPublicSiteContent("project");
  return <ContentListing title="Projects" description="Explore projects built by Techtronica members." records={records ?? []} emptyMessage="No public projects have been published yet." />;
}
