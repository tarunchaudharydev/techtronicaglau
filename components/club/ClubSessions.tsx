"use client";

import Image from "next/image";
import Link from "next/link";
import { Club } from "@/lib/config/clubs";

export default function ClubHero({ club }: { club: Club }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 sm:pt-12 pb-12 sm:pb-16">
      <div className="grid gap-8 sm:gap-10 lg:grid-cols-2 items-center">
        <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-sky-600">
            Techtronica • {club.name}
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
            <span className="block text-foreground dark:text-white">
              {club.name}
            </span>
            <span className="bg-gradient-to-r from-sky-500 via-purple-500 to-yellow-400 bg-clip-text text-transparent">
              {club.tagline}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-700 max-w-xl mx-auto lg:mx-0">
            {club.shortDescription}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 justify-center lg:justify-start">
            <Link
              href={`/clubs/${club.slug}/join`}
              className="inline-flex items-center justify-center px-6 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-semibold text-purple-950 bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500 transition-colors shadow-sm"
            >
              Join {club.name}
            </Link>

            <Link
              href={`/clubs/${club.slug}/events`}
              className="inline-flex items-center justify-center px-6 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-semibold text-purple-700 border border-purple-300 bg-white dark:bg-slate-900 hover:bg-purple-50 transition-colors shadow-sm"
            >
              View events
            </Link>
          </div>
        </div>

        <div className="relative max-w-md mx-auto lg:max-w-lg xl:max-w-xl w-full">
          <div className="absolute -inset-2 sm:-inset-3 rounded-3xl bg-gradient-to-tr from-sky-200 via-purple-200 to-orange-200 blur-xl opacity-60 -z-10" />
          <Image
            src={club.heroImage}
            alt={club.name}
            width={800}
            height={450}
            className="rounded-3xl shadow-xl w-full h-auto object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
