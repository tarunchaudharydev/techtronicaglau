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
      className="relative isolate flex min-h-[calc(100svh-5rem)] w-full items-center justify-center overflow-hidden bg-slate-950 text-white"
    >
      <Image src="/homeImages/3dcoding.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-indigo-950/85 via-blue-950/75 to-violet-950/80" />
      <div aria-hidden="true" className="absolute -left-28 top-12 size-80 rounded-full bg-sky-400/30 blur-3xl motion-safe:animate-pulse" />
      <div aria-hidden="true" className="absolute -right-24 bottom-0 size-96 rounded-full bg-violet-500/30 blur-3xl motion-safe:animate-pulse" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-24 text-center sm:px-8">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.22em] text-sky-100 backdrop-blur-md sm:text-xs">
          <span className="size-2 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,.9)]" />
          Techtronica Society · GLA University
        </span>
        <h1 className="max-w-5xl text-4xl font-black leading-[1.04] tracking-tight drop-shadow-lg sm:text-6xl lg:text-7xl xl:text-8xl">
          {title}
          {tagline && (
            <span className="mt-2 block bg-gradient-to-r from-sky-200 via-white to-violet-200 bg-clip-text text-transparent">
              {tagline}
            </span>
          )}
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-100 sm:text-lg lg:text-xl">
          {description || "A student-led technical community building skills, ideas, and impact through technology."}
        </p>
        <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/clubs"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-sky-400 px-7 text-sm font-bold text-slate-950 shadow-lg shadow-sky-950/30 transition duration-200 hover:-translate-y-0.5 hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Explore {clubs.length || "our"} clubs
          </Link>
          <Link
            href="/events"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 bg-white/10 px-7 text-sm font-bold text-white backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            See upcoming events
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-2 text-xs text-white/85 sm:gap-3 sm:text-sm">
          {["Projects & research", "Workshops", "Student community"].map((item) => (
            <span key={item} className="rounded-full border border-white/20 bg-slate-950/25 px-4 py-2 backdrop-blur-sm">
              {item}
            </span>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/60 to-transparent" />
    </section>
  );
}
