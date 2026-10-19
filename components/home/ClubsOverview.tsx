"use client";

import { Key, ReactNode } from "react";
import Image from "next/image";

type AboutSociety = {
  title: string;
  description: ReactNode[];
};

type ClubsOverviewProps = {
  aboutSociety: AboutSociety;
  setSectionRef: (el: HTMLElement | null, index: number) => void;
};

const ClubsOverview = ({ aboutSociety, setSectionRef }: ClubsOverviewProps) => {
  return (
    <section
      ref={(el) => setSectionRef(el, 0)}
      className="grid items-center gap-8 rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:gap-10 sm:p-7 lg:grid-cols-2 lg:p-10"
    >
      <div className="space-y-4 sm:space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
          {aboutSociety.title}
        </h2>

        <div className="space-y-3">
          {aboutSociety.description.map((para: ReactNode, index: Key) => (
            <p
              key={index}
              className="text-sm leading-7 text-slate-600 sm:text-base"
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <Image
          src="/homeImages/team_image.JPG"
          alt="Students collaborating in different clubs"
          width={800}
          height={500}
          className="aspect-[4/3] h-full w-full object-cover"
          priority
        />
      </div>
    </section>
  );
};

export default ClubsOverview;
