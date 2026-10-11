"use client";

import Image from "next/image";
import type { Club } from "@/lib/config/clubs";

export default function ClubPurpose({ club }: { club: Club }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16">
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[1.5fr,1.1fr] items-center">
    
        <div className="space-y-3 sm:space-y-4 text-left">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-800">
            {club.purposeTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {club.purposeDescription}
          </p>
        </div>

        <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-sky-200 via-purple-200 to-orange-200 blur-lg opacity-60 -z-10" />
          <Image
            src={club.galleryImage}
            alt={`${club.name} purpose`}
            fill
            className="rounded-3xl shadow-md object-cover"
            sizes="(min-width: 1024px) 40rem, (min-width: 640px) 32rem, 100vw"
          />
        </div>
      </div>
    </section>
  );
}
