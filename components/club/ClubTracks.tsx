import type { Club } from "@/lib/config/clubs";

export default function ClubTracks({ club }: { club: Club }) {
  return (
    <section className="max-w-6xl mx-auto px-4 pt-28 pb-20 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6 sm:space-y-8">
      <h2 className="text-lg sm:text-4xl font-extrabold text-center text-foreground dark:text-white">
        Learning tracks
      </h2>

      <div className="grid gap-5 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {club.tracks.map((t) => (
          <div
            key={t.title}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-2"
          >
            <h3 className="font-semibold text-sm sm:text-base text-foreground dark:text-white">
              {t.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {t.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
