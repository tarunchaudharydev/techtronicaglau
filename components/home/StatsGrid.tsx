import { RefObject } from "react";

type StatsGridProps = {
  statsRef: RefObject<HTMLElement | null>;
  stats: { value: string; label: string; description: string }[];
};

const StatsGrid = ({ statsRef, stats }: StatsGridProps) => {
  return (
    <section
      ref={statsRef}
      aria-label="Society statistics"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_10px_26px_rgba(15,23,42,0.08)] sm:p-5"
        >
          <p className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
            {stat.value} {stat.label}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
            {stat.description}
          </p>
        </div>
      ))}
    </section>
  );
};

export default StatsGrid;
