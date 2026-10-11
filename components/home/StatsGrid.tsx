// "use client";

// StatsGrid for home page
// this do not need to be changed.

import { RefObject } from "react";

type StatsGridProps = {
  statsRef: RefObject<HTMLDivElement | null>;
  stats: { value: string; label: string; description: string }[];
};

const StatsGrid = ({ statsRef, stats }: StatsGridProps) => {
  return (
    <div
      ref={statsRef}
      className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm mb-4 sm:mb-8"
    >
      {stats.map((stat) => <div key={stat.label} className="rounded-2xl border border-purple-100 bg-white dark:bg-slate-900/80 shadow-sm p-4">
        <p className="font-semibold text-sky-900">{stat.value} {stat.label}</p>
        <p className="text-[11px] sm:text-xs text-slate-700">{stat.description}</p>
      </div>)}
    </div>
  );
};

export default StatsGrid;
