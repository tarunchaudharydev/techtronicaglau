import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, Users } from "lucide-react";
import { getPublicClubs } from "@/lib/data/public-content";
import { mapClub } from "@/lib/config/clubs";

export const metadata: Metadata = {
  title: "Explore Student Clubs at GLA University",
  description:
    "Find your community at Techtronica. Explore student-led clubs at GLA University, discover what they do, and learn how to join.",
  alternates: { canonical: "/clubs" },
};

const cardSurfaces = [
  "bg-[#e8f0fe]",
  "bg-[#fef7e0]",
  "bg-[#e6f4ea]",
  "bg-[#fce8e6]",
  "bg-[#f1f3f4]",
];

export default async function ClubsPage() {
  const rows = await getPublicClubs();
  const clubs = (rows ?? []).map(mapClub);

  return (
    <main className="min-h-screen bg-[#f8fafd] px-4 pb-16 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.42fr)] lg:items-end lg:gap-12">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
              <span className="size-2 rounded-full bg-sky-600" />
              Techtronica · GLA University
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Find your people.{" "}
              <span className="text-sky-700 dark:text-sky-300">Build what’s next.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Explore student-led communities where you can learn by doing, share ideas, and work with people who are curious about the same things.
            </p>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <Compass aria-hidden="true" className="size-5" />
            </div>
            <h2 className="text-lg font-semibold">A place to start</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Browse each club’s focus and activities, then send a membership request when you find a good fit.
            </p>
            <Link href="/how-to-join" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:text-sky-300 dark:hover:text-sky-200">
              How to join <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </aside>
        </header>

        <section aria-labelledby="clubs-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <h2 id="clubs-heading" className="text-xl font-semibold sm:text-2xl">Explore our clubs</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {clubs.length} student-led {clubs.length === 1 ? "community" : "communities"} to explore
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
              <Users aria-hidden="true" className="size-4 text-sky-700 dark:text-sky-300" />
              GLA University students
            </span>
          </div>

          {clubs.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {clubs.map((club, index) => (
                <article key={club.slug} className="group overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <Link href={`/clubs/${club.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600">
                    <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={club.homepageImage || club.logoUrl}
                        alt={club.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className={`flex min-h-56 flex-col p-5 sm:p-6 ${cardSurfaces[index % cardSurfaces.length]} dark:bg-slate-800`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                        {club.focusAreas.length ? club.focusAreas.join(" · ") : club.tagline || "Student community"}
                      </p>
                      <h3 className="mt-3 text-2xl font-medium leading-tight tracking-tight text-slate-900 dark:text-white">
                        {club.name}
                      </h3>
                      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {club.shortDescription || club.homepageSubtitle || club.tagline}
                      </p>
                      <span className="mt-5 inline-flex min-h-10 w-fit items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-medium text-white transition-colors group-hover:bg-sky-700 dark:bg-white dark:text-slate-900 dark:group-hover:bg-sky-300">
                        Explore club <ArrowRight aria-hidden="true" className="size-4" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-lg font-semibold">Club information is being updated</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Please check back soon.</p>
            </div>
          )}
        </section>

        <section className="mt-10 flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-semibold">Not sure where to begin?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              See how club applications work, what happens after you apply, and where to follow your request.
            </p>
          </div>
          <Link href="/how-to-join" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-sky-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
            How to join <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
