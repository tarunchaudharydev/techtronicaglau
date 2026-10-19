"use client";

import Image from "next/image";
import { RefObject } from "react";
import Link from "next/link";
import type { Club } from "@/lib/config/clubs";

type HomeHeroProps = {
  heroRef: RefObject<HTMLElement | null>;
  clubs: Club[];
  title: string;
  tagline: string;
  description: string;
};

export default function HomeHero({ heroRef, clubs, title, tagline, description }: HomeHeroProps) {
  return (
    <section
      ref={heroRef}
      className="relative isolate flex min-h-[min(780px,calc(100svh-5rem))] w-full items-center overflow-hidden bg-slate-950 text-white"
    >
      <Image
        src="/homeImages/3dcoding.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-slate-900/15"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/10"
      />
      <div
        aria-hidden="true"
        className="absolute -left-28 top-12 size-80 rounded-full bg-sky-300/20 blur-3xl motion-safe:animate-pulse"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 size-96 rounded-full bg-cyan-100/15 blur-3xl motion-safe:animate-pulse"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
        <div className="max-w-4xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[.2em] text-sky-100 backdrop-blur-md sm:text-xs">
            <span className="size-2 rounded-full bg-sky-300" />
            Techtronica Society · GLA University
          </span>

          <h1 className="max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
            {title}
            {tagline && (
              <span className="mt-3 block text-sky-200">{tagline}</span>
            )}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-100 sm:text-lg lg:text-xl">
            {description || "A student-led technical community building skills, ideas, and impact through technology."}
          </p>

          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/clubs"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-sky-500 px-7 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Explore {clubs.length || "our"} clubs
            </Link>
            <Link
              href="/events"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              See upcoming events
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-2 text-xs text-white/90 sm:gap-3 sm:text-sm">
            {["Projects & research", "Workshops", "Student community"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/15 bg-slate-950/30 px-4 py-2 backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
