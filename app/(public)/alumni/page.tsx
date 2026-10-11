import AlumniTeamSection from "@/components/AlumniTeamSection";
import { getPublicAlumni } from "@/lib/data/public-content";
import { mapAlumni } from "@/lib/data/public-content-mappers";

export default async function CommunityPage() {
  const publicAlumni = await getPublicAlumni();
  const alumni = (publicAlumni ?? []).map(mapAlumni);

  return (
    <section className="min-h-screen bg-linear-to-br from-white dark:from-slate-950 via-sky-50 dark:via-slate-900 to-purple-100 dark:to-black  sm:px-4">
      <AlumniTeamSection alumni={alumni} />
    </section>
  );
}
