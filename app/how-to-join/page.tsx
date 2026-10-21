import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Compass, FileText, UserRound } from "lucide-react";
import { getPublicClubs } from "@/lib/data/public-content";
import { mapClub } from "@/lib/config/clubs";

export const metadata: Metadata = {
  title: "How to Join Techtronica",
  description:
    "Learn how to explore Techtronica's student-led clubs, submit a membership request, and follow its review status.",
  alternates: { canonical: "/how-to-join" },
};

const steps = [
  {
    number: "01",
    title: "Find a club that fits",
    description:
      "Explore each club’s focus, activities, and sessions. Choose the community that matches what you want to learn or build.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Send a request",
    description:
      "Open the club page and choose Join. Sign in to Techtronica, then submit the club’s membership request.",
    icon: FileText,
  },
  {
    number: "03",
    title: "The club reviews it",
    description:
      "Your request is sent to that club’s manager for review. Each request applies to the club you selected.",
    icon: UserRound,
  },
  {
    number: "04",
    title: "Follow your status",
    description:
      "Check your account to see the request status. If it is approved, your club membership will appear there.",
    icon: Check,
  },
];

export default async function HowToJoinPage() {
  const rows = await getPublicClubs();
  const clubs = (rows ?? []).map(mapClub);

  return (
    <main className="min-h-screen bg-[#f8fafd] px-4 pb-16 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.62fr)] lg:items-center lg:gap-12">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
              Your path into the community
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              How to join <span className="text-sky-700 dark:text-sky-300">Techtronica</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Start by exploring our clubs. When you find one that interests you, send a request and follow its review from your account.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/clubs" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-sky-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
                Explore clubs <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/account" className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                View your account
              </Link>
            </div>
          </div>
          <aside className="rounded-3xl border border-slate-200 bg-[#e8f0fe] p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-white text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300">
              <FileText aria-hidden="true" className="size-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">A clear, club-by-club process</p>
            <p className="mt-3 text-2xl font-medium leading-snug tracking-tight">
              Explore. Apply. Hear back from the club.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              A club application is reviewed by that club’s manager. You can return to your account to check its status.
            </p>
          </aside>
        </header>

        <section aria-labelledby="steps-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-7 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">The process</p>
            <h2 id="steps-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Four steps to get started</h2>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.number} className="rounded-2xl border border-slate-200 bg-[#f8fafd] p-5 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold tabular-nums text-slate-400">{step.number}</span>
                    <span className="grid size-10 place-items-center rounded-xl bg-white text-sky-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-sky-300 dark:ring-slate-700">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {clubs.length > 0 && (
          <section aria-labelledby="start-title" className="mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Choose your starting point</p>
                <h2 id="start-title" className="mt-2 text-2xl font-semibold tracking-tight">Explore a club</h2>
              </div>
              <Link href="/clubs" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-200">
                See all clubs <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {clubs.map((club, index) => (
                <article key={club.slug} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="relative h-40 bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={club.homepageImage || club.logoUrl}
                      alt={club.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className={`min-h-48 p-5 ${["bg-[#e8f0fe]", "bg-[#fef7e0]", "bg-[#e6f4ea]", "bg-[#fce8e6]", "bg-[#f1f3f4]"][index % 5]} dark:bg-slate-800`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">{club.focusAreas.length ? club.focusAreas.join(" · ") : club.tagline}</p>
                    <h3 className="mt-2 text-xl font-medium">{club.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{club.shortDescription || club.homepageSubtitle}</p>
                    <Link href={`/clubs/${club.slug}`} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:bg-slate-900 dark:text-white dark:ring-slate-700 dark:hover:bg-slate-700">
                      View club <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 rounded-2xl bg-slate-100 px-5 py-4 text-sm leading-6 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          Review times and next steps are handled by each club. If you need help with a request, use the contact details on that club’s page.
        </p>
      </div>
    </main>
  );
}
