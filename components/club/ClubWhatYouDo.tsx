"use client";

import type { Club } from "@/lib/config/clubs";

export default function ClubWhatYouDo({ club }: { club: Club }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-2 items-start">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-800 mb-3 sm:mb-4">
            What you&apos;ll do in {club.name}
          </h2>

          <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 text-sm sm:text-base text-slate-700">
            {club.whatYouDo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-sky-50/80 border border-sky-100 px-5 py-5 sm:px-6 sm:py-6 shadow-sm">
          <h3 className="font-semibold text-sm sm:text-base text-orange-600 mb-2 sm:mb-3">
            Who should join?
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Anyone curious, consistent, and willing to grow with the community.
          </p>
        </div>
      </div>
    </section>
  );
}
