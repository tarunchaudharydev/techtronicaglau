"use client";

//  this is the first thing which user see the home page with slider and welcoming message or text.
import { RefObject } from "react";
import Link from "next/link";
import HomeSlider from "@/components/HomeSlider";
import type { Club } from "@/lib/config/clubs";

type HomeHeroProps = {
  heroRef: RefObject<HTMLDivElement | null>;
  clubs: Club[];
  title: string;
  tagline: string;
  description: string;
};

const HomeHero = ({ heroRef, clubs, title, tagline, description }: HomeHeroProps) => {
  return (
    <div
      ref={heroRef}
      className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-center"
    >
      <div className="w-full lg:w-2/5 text-center lg:text-left space-y-4">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-sky-600">
          Techtronica society • GLA University
        </p>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
          {title}
          <span className="mx-2 bg-gradient-to-r from-sky-500 via-purple-500 to-yellow-400 bg-clip-text text-transparent">
            {tagline}
          </span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-800 max-w-xl mx-auto lg:mx-0">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
          <Link
            href="/clubs"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-black bg-yellow-300 hover:bg-yellow-400 transition-colors shadow-md shadow-yellow-400/40"
          >
            Explore Clubs
          </Link>

          <Link
            href="/about"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-purple-200 text-sky-900 bg-white dark:bg-slate-900/70 hover:bg-white dark:bg-slate-900 transition-colors shadow-sm"
          >
            Learn More
          </Link>
        </div>
      </div>

      {clubs.length > 0 && <HomeSlider clubs={clubs} />}
    </div>
  );
};

export default HomeHero;
