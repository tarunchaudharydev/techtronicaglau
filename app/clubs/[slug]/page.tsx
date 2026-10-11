import type { Metadata } from "next";
import { mapClub } from "@/lib/config/clubs";
import ClubPurpose from "@/components/club/ClubPurpose";
import ClubTracks from "@/components/club/ClubTracks";
import ClubWhatYouDo from "@/components/club/ClubWhatYouDo";
import ClubSessions from "@/components/club/ClubSessions";
import ClubVideo from "@/components/club/ClubVideo";
import ClubTeam from "@/components/club/ClubTeam";
import ClubContact from "@/components/club/ClubContact";
import ClubCTA from "@/components/club/ClubCTA";
import { notFound } from "next/navigation";
import { getPublicClubBySlug, getVisibleTeamMembers } from "@/lib/data/public-content";
import { mapTeamMember } from "@/lib/data/public-content-mappers";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const club = await getPublicClubBySlug(slug);
  if (!club) {
    return { title: "Club not found", robots: { index: false, follow: false } };
  }

  const description = club.description?.trim() ||
    `Explore ${club.name}, a student-led club in Techtronica at GLA University, Mathura. Discover its projects, workshops, events, and team.`;
  return {
    title: `${club.name} | Student Club at GLA University`,
    description: description.slice(0, 160),
    alternates: { canonical: `/clubs/${encodeURIComponent(club.slug)}` },
    openGraph: { title: `${club.name} | Techtronica GLAU`, description: description.slice(0, 160), type: "website" },
  };
}

export default async function ClubPage({ params }: Props) {
  const { slug } = await params;

  const [clubRow, teamRows] = await Promise.all([
    getPublicClubBySlug(slug),
    getVisibleTeamMembers(),
  ]);
  if (!clubRow) notFound();
  const club = mapClub(clubRow);
  const team = (teamRows ?? []).filter((member) => member.club_id === club.id).map(mapTeamMember);

  return (
    <>
      
      <ClubSessions club={club} />
      <ClubPurpose club={club} />
      <ClubTracks club={club} />
      <ClubWhatYouDo club={club} />

      <ClubVideo club={club} />
      <ClubTeam members={team} />
      <ClubContact club={club} />
      <ClubCTA club={club} />
    </>
  );
}
