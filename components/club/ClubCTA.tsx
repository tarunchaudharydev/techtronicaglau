"use client";

import Link from "next/link";
import type { Club } from "@/lib/config/clubs";

export default function ClubCTA({ club }: { club: Club }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="rounded-3xl bg-gradient-to-r from-orange-400 via-purple-500 to-sky-500 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9 flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between">
        <div className="text-white text-center md:text-left space-y-1">
          <h2 className="font-semibold text-base sm:text-lg md:text-xl">
            Ready to join {club.name}?
          </h2>
          <p className="text-xs sm:text-sm md:text-base opacity-90">
            Show up. Learn. Grow with the community.
          </p>
        </div>

        <div className="flex justify-center md:justify-end">
          <Link
            href={`/clubs/${club.slug}/join`}
            className="inline-flex items-center justify-center bg-white dark:bg-slate-900 text-purple-900 px-6 sm:px-7 md:px-8 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm shadow-md hover:bg-slate-100 transition-colors"
          >
            Join {club.name}
          </Link>
        </div>
      </div>
    </section>
  );
}
