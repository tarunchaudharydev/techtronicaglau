"use client";

import { useRef } from "react";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SponsorsMarquee from "@/components/home/SponsorsMarquee";
import HomeHero from "@/components/home/HomeHero";
import StatsGrid from "@/components/home/StatsGrid";
import ClubsOverview from "@/components/home/ClubsOverview";
import FeatureSection from "@/components/home/FeatureSection";
import HowToGetInvolved from "@/components/home/HowToGetInvolved";
import CoreTeamCTA from "@/components/home/CoreTeamCTA";
import type { Club } from "@/lib/config/clubs";
import type { SiteContentRow } from "@/lib/data/public-content";
import { contentList, contentObject, contentText } from "@/lib/data/content-fields";
import type { Json } from "@/types/database";

export default function HomePageContent({ clubs, about, features, sponsors, stats }: {
  clubs: Club[];
  about: SiteContentRow | null;
  features: SiteContentRow[];
  sponsors: SiteContentRow[];
  stats: { value: string; label: string; description: string }[];
}) {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<HTMLDivElement[]>([]);
  const setSectionRef = (element: HTMLDivElement | null, index: number) => { if (element) sectionRefs.current[index] = element; };
  const aboutContent = contentObject(about?.content ?? {});
  const paragraphs = contentList(aboutContent.description);
  const layoutFeature = (row: SiteContentRow) => contentText(contentObject(row.content).placement);
  const involvement = features.find((row) => layoutFeature(row) === "involvement");
  const cta = features.find((row) => layoutFeature(row) === "core_team_cta");
  const displayFeatures = features.filter((row) => !["involvement", "core_team_cta"].includes(layoutFeature(row)));
  const title = contentText(aboutContent.title, "Techtronica");
  const heroTitle = contentText(aboutContent.hero_title, title);
  const tagline = contentText(aboutContent.hero_tagline);
  const heroDescription = contentText(aboutContent.hero_description, paragraphs[0] ?? "");
  const sponsorItems = sponsors.flatMap((row) => {
    const content = contentObject(row.content);
    const logo = contentText(content.logo_url);
    return logo ? [{ name: row.title, logo }] : [];
  });

  return <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-white via-sky-50 to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-black">
    <section className="w-full max-w-6xl space-y-16 px-3 pb-20 pt-8 text-slate-950 sm:space-y-20 sm:px-4 dark:text-white">
      {about && <HomeHero heroRef={heroRef} clubs={clubs} title={heroTitle} tagline={tagline} description={heroDescription} />}
      {stats.length > 0 && <StatsGrid statsRef={statsRef} stats={stats} />}
      {about && paragraphs.length > 0 && <ClubsOverview aboutSociety={{ title, description: paragraphs }} setSectionRef={setSectionRef} />}
      {displayFeatures.map((feature, index) => {
        const content = contentObject(feature.content);
        const featureTitle = contentText(content.title, feature.title);
        const p1 = contentText(content.p1);
        const p2 = contentText(content.p2);
        const image = contentText(content.image);
        if (!p1 || !image) return null;
        return <FeatureSection key={feature.id} setSectionRef={setSectionRef} index={index + 1} title={featureTitle} p1={p1} p2={p2} imgSrc={image} imgAlt={contentText(content.alt, featureTitle)} />;
      })}
      {sponsorItems.length > 0 && <SponsorsMarquee sponsors={sponsorItems} />}
      {involvement && <HowToGetInvolved title={contentText(contentObject(involvement.content).title)} steps={jsonObjects(contentObject(involvement.content).items).flatMap((item) => {
        const stepTitle = contentText(item.title);
        const description = contentText(item.description);
        return stepTitle && description ? [{ title: stepTitle, description }] : [];
      })} />}
      {cta && <CoreTeamCTA title={contentText(contentObject(cta.content).title)} description={contentText(contentObject(cta.content).description)} buttonLabel={contentText(contentObject(cta.content).button_label)} href={safeInternalHref(contentText(contentObject(cta.content).href))} />}
    </section>
    <WhatsAppFloat />
  </main>;
}

function jsonObjects(value: Json | undefined) {
  return Array.isArray(value) ? value.flatMap((entry) => entry && typeof entry === "object" && !Array.isArray(entry) ? [entry] : []) : [];
}

function safeInternalHref(value: string) { return value.startsWith("/") && !value.startsWith("//") ? value : "/about"; }
