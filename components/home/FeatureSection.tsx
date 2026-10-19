"use client";

import Image from "next/image";
import Link from "next/link";

type FeatureSectionProps = {
  setSectionRef: (el: HTMLDivElement | null, index: number) => void;
  index: number;
  title: string;
  p1: string;
  p2: string;
  imgSrc: string;
  imgAlt: string;
  showTeamLink?: boolean;
};

const FeatureSection = ({
  setSectionRef,
  index,
  title,
  p1,
  p2,
  imgSrc,
  imgAlt,
  showTeamLink,
}: FeatureSectionProps) => {
  const imageOnLeft = index % 2 === 1;

  return (
    <section
      ref={(el) => setSectionRef(el, index)}
      className="grid overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)] lg:grid-cols-2"
    >
      <div
        className={`order-1 flex flex-col justify-center p-6 sm:p-9 lg:p-12 ${imageOnLeft ? "lg:order-2" : "lg:order-1"}`}
      >
        <div className="max-w-xl space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h2>
          <p className="text-sm leading-7 text-slate-700 sm:text-base">{p1}</p>
          <p className="text-sm leading-7 text-slate-600">{p2}</p>

          {showTeamLink && (
            <Link
              href="/team"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
            >
              Meet the core team
            </Link>
          )}
        </div>
      </div>

      <div
        className={`order-2 min-h-64 bg-slate-100 lg:min-h-[28rem] ${imageOnLeft ? "lg:order-1" : "lg:order-2"}`}
      >
        <Image
          src={imgSrc}
          alt={imgAlt}
          width={1000}
          height={720}
          className="h-full min-h-64 w-full object-cover lg:min-h-[28rem]"
        />
      </div>
    </section>
  );
};

export default FeatureSection;
