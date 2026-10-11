import HomePageContent from "@/components/home/HomePageContent";
import { getHomepageCounts, getPublicClubs, getPublicSiteContent } from "@/lib/data/public-content";
import { mapClub } from "@/lib/config/clubs";

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
