"use client";

import { useEffect, useState } from "react";

type OverviewDatum = {
  label: string;
  count: number | null;
  unavailable: boolean;
};

const colors = [
  "#0284c7",
  "#64748b",
  "#d97706",
  "#0e7490",
  "#059669",
  "#94a3b8",
  "#0f766e",
  "#475569",
];
const radius = 43;
const circumference = 2 * Math.PI * radius;

export function AdminOverviewDonut({ stats }: { stats: OverviewDatum[] }) {
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const values = stats.map((stat) =>
    stat.unavailable ? 0 : Math.max(0, stat.count ?? 0),
  );
  const total = values.reduce((sum, value) => sum + value, 0);
  const active = stats[activeIndex] ?? stats[0];
  const activeValue = active?.unavailable ? null : active?.count ?? 0;

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setProgress(1);
      return;
    }

    const duration = 850;
    let frame = 0;
    let start = 0;
    const animate = (time: number) => {
      if (!start) start = time;
      const elapsed = Math.min(1, (time - start) / duration);
      setProgress(1 - Math.pow(1 - elapsed, 3));
      if (elapsed < 1) frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section
      aria-labelledby="workflow-volume-title"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 id="workflow-volume-title" className="text-sm font-bold text-slate-950 sm:text-base">
            Workflow volumes
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Applications, enquiries, and registrations by status
          </p>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold tabular-nums text-slate-600 ring-1 ring-slate-200">
          {total.toLocaleString("en-IN")} records
        </span>
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
        <div className="mx-auto w-32">
          <div
            className="relative aspect-square w-full"
            onMouseLeave={() => setActiveIndex(0)}
          >
            <svg
              viewBox="0 0 112 112"
              className="size-full"
              role="img"
              aria-label={
                "Workflow status chart: " +
                stats
                  .map(
                    (stat) =>
                      stat.label +
                      ": " +
                      (stat.unavailable ? "unavailable" : stat.count ?? 0),
                  )
                  .join(", ")
              }
            >
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="13"
              />
              {total > 0 &&
                stats.map((stat, index) => {
                  const value = values[index] ?? 0;
                  if (!value) return null;
                  const preceding = values
                    .slice(0, index)
                    .reduce((sum, item) => sum + item, 0);
                  const segmentLength = Math.max(
                    0,
                    (value / total) * circumference - 2,
                  );
                  const offset = (preceding / total) * circumference;
                  return (
                    <circle
                      key={stat.label}
                      cx="56"
                      cy="56"
                      r={radius}
                      fill="none"
                      stroke={colors[index % colors.length]}
                      strokeWidth={activeIndex === index ? 16 : 13}
                      strokeDasharray={
                        segmentLength * progress + " " + circumference
                      }
                      strokeDashoffset={-offset * progress}
                      transform="rotate(-90 56 56)"
                      strokeLinecap="round"
                      className="transition-[stroke-width,opacity] duration-200 motion-reduce:transition-none"
                      opacity={activeIndex === index ? 1 : 0.82}
                    />
                  );
                })}
            </svg>
            <div className="pointer-events-none absolute inset-[25%] grid place-content-center rounded-full bg-white text-center">
              <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-950">
                {activeValue === null
                  ? "—"
                  : Math.round(activeValue * progress).toLocaleString("en-IN")}
              </span>
              <span className="mx-auto mt-0.5 max-w-20 text-[10px] font-semibold leading-3 text-slate-500">
                {active?.label ?? "Statuses"}
              </span>
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-500">
            Hover or select a status
          </p>
        </div>

        <ul className="grid min-w-0 gap-x-3 gap-y-1 sm:grid-cols-2">
          {stats.map((stat, index) => (
            <li key={stat.label}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                className={
                  "flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 " +
                  (activeIndex === index
                    ? "bg-sky-50"
                    : "hover:bg-slate-50")
                }
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
                  {stat.label}
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                  {stat.unavailable
                    ? "—"
                    : Math.round(
                        Math.max(0, stat.count ?? 0) * progress,
                      ).toLocaleString("en-IN")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-4 text-slate-500">
        Club applications are split into pending and reviewed. Enquiries show their current workflow state; registrations show active or completed states.
      </p>
    </section>
  );
}
