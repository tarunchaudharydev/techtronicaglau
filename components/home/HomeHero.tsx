"use client";

import Image from "next/image";
import { useEffect, useState, type RefObject } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Club } from "@/lib/config/clubs";

type HomeHeroProps = {
  heroRef: RefObject<HTMLElement | null>;
  clubs: Club[];
  title: string;
  tagline: string;
  description: string;
};

type ClubSlide = {
  club: Club;
  position: -1 | 0 | 1;
};

export default function HomeHero({ heroRef, clubs, title, tagline, description }: HomeHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (clubs.length < 2 || isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % clubs.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [clubs.length, isPaused]);

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + clubs.length) % clubs.length);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % clubs.length);
  };

  let slides: ClubSlide[] = [];
  if (clubs.length === 1) {
    slides = [{ club: clubs[0], position: 0 }];
  } else if (clubs.length === 2) {
    slides = [
      { club: clubs[activeIndex], position: 0 },
      { club: clubs[(activeIndex + 1) % clubs.length], position: 1 },
    ];
  } else if (clubs.length > 2) {
    slides = [
      { club: clubs[(activeIndex - 1 + clubs.length) % clubs.length], position: -1 },
      { club: clubs[activeIndex], position: 0 },
      { club: clubs[(activeIndex + 1) % clubs.length], position: 1 },
    ];
  }

  return (
    <section
      ref={heroRef}
      className="relative isolate overflow-hidden bg-[linear-gradient(115deg,#fbfdff_0%,#f2f8fc_54%,#edf5fa_100%)] text-slate-950"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-16 size-96 rounded-full bg-sky-100/80 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 bottom-0 size-[30rem] rounded-full bg-amber-50/80 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-7xl grid-cols-1 items-center gap-5 px-5 py-12 sm:px-8 md:grid-cols-[0.86fr_1.14fr] md:gap-8 md:py-16 lg:px-10">
        <div className="relative z-10 mx-auto w-full max-w-xl text-center md:mx-0 md:text-left">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-sky-700 sm:text-xs">
            <span aria-hidden="true" className="size-2 rounded-full bg-amber-400" />
            Techtronica Society · GLA University
          </span>

          <h1 className="mt-5 text-[clamp(2.65rem,5.2vw,5.15rem)] font-black leading-[1.02] tracking-[-.045em] text-slate-950">
            {title}
            {tagline && (
              <span className="mt-1 block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg, #168bff 0%, #6858ff 35%, #aa57ef 55%, #e69a9c 78%, #ffc900 100%)" }}>
                {tagline}
              </span>
            )}
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 md:mx-0">
            {description || "A student-led technical community building skills, ideas, and impact through technology."}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Link
              href="/clubs"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-amber-300 px-7 text-sm font-bold text-slate-950 shadow-[0_8px_18px_rgba(217,160,16,.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
            >
              Explore {clubs.length || "our"} clubs
            </Link>
            <Link
              href="/events"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white/80 px-7 text-sm font-bold text-slate-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
            >
              See upcoming events
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs font-medium text-slate-600 sm:gap-3 sm:text-sm md:justify-start">
            {["Projects & research", "Workshops", "Student community"].map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-white/75 px-4 py-2 shadow-sm">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div
          className="relative mx-auto w-full max-w-3xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="region"
          aria-label="Featured clubs"
          aria-roledescription="carousel"
        >
          <div className="relative h-[25rem] w-full sm:h-[29rem] lg:h-[33rem]">
            {slides.map(({ club, position }) => {
              const isActive = position === 0;
              const rotation = position === 0 ? 0 : position < 0 ? -7 : 7;
              const scale = isActive ? 1 : 0.82;

              return (
                <Link
                  key={club.id}
                  href={"/clubs/" + club.slug}
                  aria-label={"View " + club.name + " club"}
                  aria-current={isActive ? "true" : undefined}
                  tabIndex={isActive ? 0 : -1}
                  className={[
                    "absolute group left-1/2 top-1/2 block h-[82%] aspect-[0.72] overflow-hidden rounded-[1.75rem] border border-white/70 bg-slate-900 shadow-[0_24px_60px_rgba(15,23,42,.24)] outline-none transition-[transform,opacity,filter,box-shadow] duration-700 ease-[cubic-bezier(.2,.75,.25,1)] motion-reduce:transition-none",
                    isActive
                      ? "z-30 opacity-100 shadow-[0_30px_80px_rgba(15,23,42,.32)] focus-visible:ring-4 focus-visible:ring-sky-400"
                      : "pointer-events-none z-10 opacity-0 md:pointer-events-auto md:opacity-65 md:hover:opacity-90",
                  ].join(" ")}
                  style={{
                    transform:
                      "translate(-50%, -50%) translateX(" +
                      position * 80 +
                      "%) scale(" +
                      scale +
                      ") rotate(" +
                      rotation +
                      "deg)",
                  }}
                >
                  <Image
                    src={club.homepageImage || club.heroImage || club.logoUrl}
                    alt=""
                    fill
                    priority={isActive}
                    sizes="(max-width: 767px) 75vw, (max-width: 1279px) 38vw, 440px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-slate-950/5" />

                  <span className="absolute inset-x-0 bottom-0 p-5 text-left text-white sm:p-7">
                    {club.homepageBadge && (
                      <span className="mb-3 inline-flex rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-sky-100 backdrop-blur-sm sm:text-xs">
                        {club.homepageBadge}
                      </span>
                    )}
                    <span className="block text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                      {club.name}
                    </span>
                    {(club.homepageSubtitle || club.tagline) && (
                      <span className="mt-2 line-clamp-2 block text-sm font-medium leading-6 text-white/80 sm:text-base">
                        {club.homepageSubtitle || club.tagline}
                      </span>
                    )}
                    <span className="mt-5 inline-flex min-h-10 items-center rounded-full bg-white px-5 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-200">
                      View more <span aria-hidden="true" className="ml-2">→</span>
                    </span>
                  </span>
                </Link>
              );
            })}

            {clubs.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Previous club"
                  className="absolute left-0 top-1/2 z-40 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-sky-200 bg-white/95 text-sky-700 shadow-lg transition hover:scale-105 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 sm:left-2 sm:size-12 md:-left-1"
                >
                  <ArrowLeft aria-hidden="true" size={23} />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next club"
                  className="absolute right-0 top-1/2 z-40 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-sky-200 bg-white/95 text-sky-700 shadow-lg transition hover:scale-105 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 sm:right-2 sm:size-12 md:-right-1"
                >
                  <ArrowRight aria-hidden="true" size={23} />
                </button>
              </>
            )}
          </div>

          {clubs.length > 1 && (
            <div role="group" className="mt-1 flex justify-center gap-2" aria-label="Choose a club">
              {clubs.map((club, index) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={"Show " + club.name}
                  aria-current={index === activeIndex ? "true" : undefined}
                  className={[
                    "h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2",
                    index === activeIndex ? "w-8 bg-sky-700" : "w-2.5 bg-slate-300 hover:bg-slate-400",
                  ].join(" ")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
