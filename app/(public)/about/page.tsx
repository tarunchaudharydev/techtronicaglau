import type { Metadata } from "next";
import Image from "next/image";
import AboutAnimatedSection from "@/components/about/AboutAnimatedSection";
import MissionVisionValue from "@/components/about/MissionVisionValue";
import AboutTeamSection from "@/components/AboutTeamSection";
import BirthdayBanner from "@/components/features/BirthdayBanner";
import {
  getPublicSiteContent,
  getVisibleTeamMembers,
} from "@/lib/data/public-content";
import {
  contentList,
  contentObject,
  contentText,
} from "@/lib/data/content-fields";
import { mapTeamMember } from "@/lib/data/public-content-mappers";

export const metadata: Metadata = {
  title: "About Us | Techtronica Society",
  description:
    "Learn about Techtronica Society, our purpose, mission, vision, values, and community.",
};

export default async function AboutPage() {
  const [sections, missionRows, visibleTeam] = await Promise.all([
    getPublicSiteContent("about_section"),
    getPublicSiteContent("mission_vision_value"),
    getVisibleTeamMembers(),
  ]);
  const hero = sections?.find((row) => row.slug === "hero");
  const who = sections?.find((row) => row.slug === "who-we-are");
  const heroContent = contentObject(hero?.content ?? {});
  const whoContent = contentObject(who?.content ?? {});
  const heroImage = safeImageSource(contentText(heroContent.image_url));
  const team = (visibleTeam ?? [])
    .filter((member) => member.club_id === null)
    .map(mapTeamMember);
  const values = (missionRows ?? []).flatMap((row) => {
    const content = contentObject(row.content);
    const label = contentText(content.label, row.title);
    const text = contentText(content.text);
    return text ? [{ label, text }] : [];
  });

  return (
    <main className="min-h-screen bg-gray-50 pt-20 text-gray-700">
      <BirthdayBanner members={team} />
      {hero && (
        <section className="relative -mt-8 flex min-h-[70vh] items-center justify-center overflow-hidden px-6 text-center">
          {heroImage && (
            <Image
              src={heroImage}
              alt={contentText(heroContent.image_alt, hero.title)}
              fill
              priority
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-indigo-900/75" />
          <div className="relative z-10 max-w-4xl">
            <h1 className="text-5xl font-extrabold tracking-tight text-white md:text-7xl">
              {contentText(heroContent.heading, hero.title)}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-indigo-100 md:text-xl">
              {contentText(heroContent.description)}
            </p>
          </div>
        </section>
      )}
      {who && (
        <section className="overflow-hidden py-20">
          <AboutAnimatedSection
            heading={contentText(whoContent.heading, who.title)}
            paragraphs={contentList(whoContent.paragraphs)}
            imageUrl={safeImageSource(contentText(whoContent.image_url)) ?? ""}
          />
        </section>
      )}
      {values.length > 0 && (
        <section className="bg-white py-20 dark:bg-slate-900">
          <MissionVisionValue items={values} />
        </section>
      )}
      <AboutTeamSection members={team} />
    </main>
  );
}

function safeImageSource(value: string) {
  return (value.startsWith("/") && !value.startsWith("//")) ||
    value.startsWith(
      "https://erivblclxwtonwysgdle.supabase.co/storage/v1/object/public/",
    )
    ? value
    : "";
}
