import type { Metadata } from "next";
import HomePageContent from "@/components/home/HomePageContent";
import { getHomepageCounts, getPublicClubs, getPublicSiteContent } from "@/lib/data/public-content";
import { mapClub } from "@/lib/config/clubs";

export const metadata: Metadata = {
  title: "Technical Clubs, Projects & Events at GLA University",
  description:
    "Meet Techtronica, GLA University Mathura’s student technical society. Explore five student-led clubs, engineering projects, workshops, and upcoming campus events.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [clubRows, aboutRows, featureRows, sponsorRows, stats] = await Promise.all([
    getPublicClubs(),
    getPublicSiteContent("home_about"),
    getPublicSiteContent("home_feature"),
    getPublicSiteContent("sponsor"),
    getHomepageCounts(),
  ]);
  return <HomePageContent
    clubs={(clubRows ?? []).map(mapClub)}
    about={aboutRows?.[0] ?? null}
    features={featureRows ?? []}
    sponsors={sponsorRows ?? []}
    stats={stats ?? []}
  />;
}
