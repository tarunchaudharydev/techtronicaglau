"use client";

import { useEffect, useState } from "react";

type OverviewDatum = {
  label: string;
  count: number | null;
  unavailable: boolean;
};

const colors = ["#0284c7", "#7c3aed", "#059669", "#d97706"];
const circumference = 2 * Math.PI * 76;

export function AdminOverviewDonut({ stats }: { stats: OverviewDatum[] }) {
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const availableValues = stats.map((stat) => stat.unavailable ? 0 : Math.max(0, stat.count ?? 0));
  const total = availableValues.reduce((sum, value) => sum + value, 0);
  const active = stats[activeIndex] ?? stats[0];
  const activeValue = active?.unavailable ? null : active?.count ?? 0;

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setProgress(1);
      return;
    }

    const duration = 1000;
    let frame = 0;
    let start = 0;
    const animate = (time: number) => {
      if (!start) start = time;
      const elapsed = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setProgress(eased);
      if (elapsed < 1) frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="grid min-w-0 items-center gap-6 rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/70 to-violet-50/70 p-4 shadow-sm sm:grid-cols-[minmax(15rem,0.85fr)_minmax(0,1.15fr)] sm:gap-8 sm:p-6">
      <div className="mx-auto w-full max-w-[17rem]">
        <div className="relative mx-auto aspect-square w-full" onMouseLeave={() => setActiveIndex(0)}>
          <svg viewBox="0 0 200 200" className="size-full" role="img" aria-label={`Pie chart showing ${stats.map((stat) => `${stat.label}: ${stat.unavailable ? "unavailable" : stat.count ?? 0}`).join(", ")}`}>
            <circle cx="100" cy="100" r="76" fill="none" stroke="#e2e8f0" strokeWidth="22" />
            {total > 0 && stats.map((stat, index) => {
              const value = availableValues[index] ?? 0;
              if (!value) return null;
              const preceding = availableValues.slice(0, index).reduce((sum, item) => sum + item, 0);
              const segmentLength = Math.max(0, (value / total) * circumference - 3);
              const offset = (preceding / total) * circumference;
              return (
                <circle
                  key={stat.label}
                  cx="100"
                  cy="100"
                  r="76"
                  fill="none"
                  stroke={colors[index % colors.length]}
                  strokeWidth={activeIndex === index ? "27" : "22"}
                  strokeDasharray={`${segmentLength * progress} ${circumference}`}
                  strokeDashoffset={-offset * progress}
                  transform="rotate(-90 100 100)"
                  strokeLinecap="round"
                  className="cursor-pointer transition-[stroke-width,opacity] duration-200 motion-reduce:transition-none"
                  opacity={activeIndex === index ? 1 : 0.82}
                  role="img"
                  aria-label={`${stat.label}: ${stat.count?.toLocaleString("en-IN") ?? "0"}`}
                  tabIndex={0}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                />
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-[23%] grid place-content-center rounded-full bg-white/95 text-center shadow-inner shadow-slate-200/70">
            {active && <span className="mx-auto mb-1.5 size-2.5 rounded-full" style={{ backgroundColor: colors[activeIndex % colors.length] }} />}
            <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-4xl">
              {activeValue === null ? "—" : Math.round(activeValue * progress).toLocaleString("en-IN")}
            </span>
            <span className="mx-auto mt-1 max-w-[9rem] text-xs font-semibold leading-4 text-slate-500">{active?.label ?? "Overview"}</span>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">Hover or focus a slice for details</p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-950">Society at a glance</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Live totals from records visible to your admin account.</p>
          </div>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
            {total.toLocaleString("en-IN")} total
          </span>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {stats.map((stat, index) => (
            <li key={stat.label}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                className={`flex min-h-[4.25rem] w-full min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${activeIndex === index ? "border-sky-200 bg-white shadow-sm" : "border-white/80 bg-white/60 hover:bg-white"}`}
              >
                <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-slate-600">{stat.label}</span>
                  <span className="mt-0.5 block text-lg font-bold tabular-nums text-slate-950">
                    {stat.unavailable ? "—" : Math.round(Math.max(0, stat.count ?? 0) * progress).toLocaleString("en-IN")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-4 text-slate-500">The chart compares the four displayed totals. Select a metric to keep its value in the center.</p>
      </div>
    </div>
  );
}
