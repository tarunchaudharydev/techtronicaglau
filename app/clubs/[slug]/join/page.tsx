import { notFound } from "next/navigation";
import JoinClubForm from "@/components/clubs/JoinClubForm";
import { getPublicClubBySlug } from "@/lib/data/public-content";

export default async function JoinClub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const publicClub = await getPublicClubBySlug(slug);
  if (!publicClub) notFound();
  const club = publicClub;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 shadow-lg border border-slate-100 p-6 sm:p-8">
        
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white mb-2">
          Join <span className="text-purple-700">{club.name}</span>
        </h1>

        <p className="text-sm sm:text-base text-muted mb-6">
          Fill the interest form to become a part of{" "}
          <span className="font-medium">{club.name}</span>.
        </p>

        
        <div className="rounded-2xl bg-slate-50 border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <p className="text-sm text-slate-700 leading-relaxed">
            By joining <strong>{club.name}</strong>, you’ll get access to
            workshops, hands-on sessions, events, and a community of like-minded
            students passionate about learning and growth.
          </p>
        </div>

    
        <JoinClubForm clubName={publicClub.name} clubSlug={publicClub.slug} />
      </div>
    </main>
  );
}
