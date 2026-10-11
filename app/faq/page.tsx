import FAQ from "@/components/policy/FAQ";
import { getPublicSiteContent } from "@/lib/data/public-content";

export default async function FAQPage() {
  const faqs = await getPublicSiteContent("faq");
  return <FAQ faqs={faqs ?? []} />;
}
