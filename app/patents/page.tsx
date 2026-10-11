import type { Metadata } from "next";
import ContentListing from "@/components/content/ContentListing";
import { getPublicSiteContent } from "@/lib/data/public-content";
import { contentObject, contentText } from "@/lib/data/content-fields";

export const metadata: Metadata = { title: "Patents | Techtronica" };

export default async function PatentsPage() {
  const rows = await getPublicSiteContent("research_work");
  const records = (rows ?? []).filter((row) => contentText(contentObject(row.content).kind).toLowerCase() === "patent");
  return <ContentListing title="Patents" description="Patent disclosures and innovations shared by the Techtronica community." records={records} emptyMessage="No public patent records have been published yet." />;
}
