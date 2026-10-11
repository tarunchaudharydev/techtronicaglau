import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicClubs } from "@/lib/data/public-content";
import { mapClub } from "@/lib/config/clubs";

export const metadata: Metadata = {
  title: "Student Technical Clubs at GLA University",
  description:
    "Explore Techtronica’s student-led technical clubs at GLA University, Mathura, covering engineering, coding, robotics, electronics, creativity, and innovation.",
  alternates: { canonical: "/clubs" },
};

export default async function ClubsPage() {
  const rows = await getPublicClubs();
  const clubs = (rows ?? []).map(mapClub);
  return (
    <main className="min-h-screen flex justify-center bg-gradient-to-br from-white dark:from-slate-950 via-sky-50 dark:via-slate-900 to-purple-100 dark:to-black">
      <section className="w-full max-w-5xl pb-16">
        {/* Top text section */}
        <header className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-600 mb-2">
            Techtronica • Clubs
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground dark:text-white mb-2">
            Explore our clubs
          </h1>
          <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto">
            Join the communities that match your interests—from coding and
            robotics to creativity, culture, and hands-on innovation. Learn,
            collaborate, and grow with like‑minded students.
          </p>
        </header>

        <div className="grid gap-6 sm:gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <article
              key={club.slug}
              className="
                group
                rounded-3xl bg-sky-50
                border border-slate-200 dark:border-slate-800/80
                shadow-sm
                overflow-hidden
                transition-all
                duration-200
                hover:-translate-y-1
                hover:shadow-lg
                hover:border-sky-200
              "
            >
            
              <div style={{ height: "9rem" }} className="relative w-full">
                <Image
                  src={club.logoUrl}
                  alt={club.name}
                  fill
                  sizes="(max-width: 640px) 100vw,
                         (max-width: 1024px) 50vw,
                         33vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </div>

              <div className="p-4 flex flex-col gap-1.5">
                <p className="text-[11px] uppercase tracking-wide text-sky-600">
                  {club.focusAreas.length ? club.focusAreas.join(" · ") : club.tagline}
                </p>

                <h2 className="font-semibold text-foreground dark:text-white">
                  {club.name}
                </h2>

                <p className="text-sm text-slate-700 mt-1 flex-1">
                  {club.shortDescription}
                </p>

                <Link
                  href={`/clubs/${club.slug}`}
                  className="mt-2 text-sm font-semibold text-sky-700 group-hover:text-sky-900 transition-colors"
                >
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>
        {clubs.length === 0 && <p className="mt-8 text-center text-sm text-muted">Club information is being updated. Please check back soon.</p>}
      </section>
    </main>
  );
}
