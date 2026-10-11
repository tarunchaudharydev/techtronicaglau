import type { Metadata } from "next";
import ContentListing from "@/components/content/ContentListing";
import { getPublicSiteContent } from "@/lib/data/public-content";
import { contentObject, contentText } from "@/lib/data/content-fields";

export const metadata: Metadata = { title: "Research | Techtronica" };

export default async function ResearchPage() {
  const rows = await getPublicSiteContent("research_work");
  const records = (rows ?? []).filter((row) => contentText(contentObject(row.content).kind).toLowerCase() === "research");
  return <ContentListing title="Research" description="Research work published by the Techtronica community." records={records} emptyMessage="No public research works have been published yet." />;
}
