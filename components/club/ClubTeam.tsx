import Image from "next/image";
import type { Member } from "@/lib/data/teamData";

export default function ClubTeam({ members }: { members: Member[] }) {
  if (members.length === 0) return null;
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h2 className="pt-20 text-lg sm:text-2xl font-bold mb-10 text-center text-foreground dark:text-white">
        Club Team
      </h2>

      <div className="flex justify-center">
        <div
          className="
            flex
            flex-wrap
            justify-between
            gap-y-10
            w-full
            max-w-4xl
          "
        >
          {members.map((m) => (
            <div
              key={m.id}
              className="
                w-[180px]
                text-center
                flex flex-col items-center
                space-y-2
                bg-white dark:bg-slate-900
                rounded-2xl
                shadow-md
                px-6 py-6
                transition-all duration-300
                hover:shadow-xl
                hover:-translate-y-1
              "
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                <Image
                  src={m.image}
                  alt={m.name}
                  fill
                  className="rounded-full object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(min-width: 1024px) 7rem, (min-width: 640px) 6rem, 5rem"
                />
              </div>

              <p className="font-semibold text-xs sm:text-sm text-foreground dark:text-white">
                {m.name}
              </p>
              <p className="text-[11px] sm:text-xs text-muted">{m.roles.join(" · ")}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
