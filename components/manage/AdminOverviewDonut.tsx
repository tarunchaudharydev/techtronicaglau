"use client";

import { useState } from "react";

type OverviewDatum = { label: string; count: number | null; unavailable: boolean };
type ChartMode = "donut" | "polar" | "radar";

const colors = ["#1a73e8", "#5f6368", "#f9ab00", "#12b5cb", "#34a853", "#9aa0a6", "#188038", "#3c4043"];
const chartModes: { id: ChartMode; label: string; accessibleLabel: string }[] = [
  { id: "donut", label: "Donut", accessibleLabel: "Donut chart" },
  { id: "polar", label: "Polar area", accessibleLabel: "Polar area chart" },
  { id: "radar", label: "Radar", accessibleLabel: "Radar chart" },
];
const donutRadius = 43;
const donutCircumference = 2 * Math.PI * donutRadius;

export function AdminOverviewDonut({ stats }: { stats: OverviewDatum[] }) {
  const [chartMode, setChartMode] = useState<ChartMode>("donut");
  const values = stats.map((stat) => stat.unavailable ? 0 : Math.max(0, stat.count ?? 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(1, ...values);

  return (
    <section aria-labelledby="workflow-volume-title" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="workflow-volume-title" className="text-sm font-bold text-slate-950 sm:text-base">Workflow volumes</h3>
          <p className="mt-1 text-xs text-slate-500">Applications, enquiries, and registrations by status</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-600 sm:inline-flex">{total.toLocaleString("en-IN")} records</span>
          <div className="inline-flex flex-wrap rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Chart type">
            {chartModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-label={mode.accessibleLabel}
                aria-pressed={chartMode === mode.id}
                onClick={() => setChartMode(mode.id)}
                className={"min-h-8 rounded-md px-2.5 text-xs font-medium " + (chartMode === mode.id ? "bg-sky-50 text-sky-800" : "text-slate-600")}
              >{mode.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
        <div className="mx-auto w-32">
          <div className="relative aspect-square w-full">
            <svg
              viewBox="0 0 128 128"
              className="size-full"
              role="img"
              aria-label={(chartModes.find((mode) => mode.id === chartMode)?.accessibleLabel ?? "Chart") + ": " + stats.map((stat) => stat.label + ": " + (stat.unavailable ? "unavailable" : stat.count ?? 0)).join(", ")}
            >
              {chartMode === "donut" && (
                <>
                  <circle cx="64" cy="64" r={donutRadius} fill="none" stroke="#e8eaed" strokeWidth="13" />
                  {total > 0 && stats.map((stat, index) => {
                    const value = values[index] ?? 0;
                    if (!value) return null;
                    const preceding = values.slice(0, index).reduce((sum, item) => sum + item, 0);
                    const segmentLength = Math.max(0, (value / total) * donutCircumference - 2);
                    const offset = (preceding / total) * donutCircumference;
                    return <circle
                      key={stat.label}
                      cx="64" cy="64" r={donutRadius} fill="none"
                      stroke={colors[index % colors.length]} strokeWidth="13"
                      strokeDasharray={segmentLength + " " + donutCircumference}
                      strokeDashoffset={-offset}
                      transform="rotate(-90 64 64)" strokeLinecap="butt"
                    />;
                  })}
                  <text x="64" y="61" textAnchor="middle" className="fill-slate-950 text-xl font-bold">{total.toLocaleString("en-IN")}</text>
                  <text x="64" y="76" textAnchor="middle" className="fill-slate-500 text-[8px]">records</text>
                </>
              )}

              {chartMode === "polar" && stats.map((stat, index) => {
                const value = values[index] ?? 0;
                if (!value) return null;
                return <path
                  key={stat.label}
                  d={polarAreaPath(value, maxValue, index, stats.length)}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="1.25"
                />;
              })}

              {chartMode === "radar" && (
                <>
                  {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={radarPoints(stats.length, 48 * scale)} fill="none" stroke="#dadce0" strokeWidth="1" />)}
                  {stats.map((stat, index) => {
                    const point = radarPoint(stats.length, 48, index);
                    return <line key={stat.label} x1="64" y1="64" x2={point.x} y2={point.y} stroke="#dadce0" strokeWidth="1" />;
                  })}
                  <polygon points={radarPoints(stats.length, 48, values, maxValue)} fill="rgba(26, 115, 232, 0.16)" stroke="#1a73e8" strokeWidth="2" strokeLinejoin="round" />
                  {stats.map((stat, index) => {
                    const point = radarPoint(stats.length, 48 * ((values[index] ?? 0) / maxValue), index);
                    return <circle key={stat.label} cx={point.x} cy={point.y} r="2.5" fill={colors[index % colors.length]} stroke="white" strokeWidth="1" />;
                  })}
                </>
              )}
            </svg>
          </div>
        </div>

        <ul className="grid min-w-0 gap-x-3 gap-y-1 sm:grid-cols-2" aria-label="Chart values">
          {stats.map((stat, index) => (
            <li key={stat.label} className="flex min-h-9 min-w-0 items-center gap-2 rounded-md px-2 py-1">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{stat.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{stat.unavailable ? "—" : (stat.count ?? 0).toLocaleString("en-IN")}</span>
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

function polarPoint(center: number, distance: number, angle: number) {
  return { x: Number((center + distance * Math.cos(angle)).toFixed(2)), y: Number((center + distance * Math.sin(angle)).toFixed(2)) };
}

function polarAreaPath(value: number, maxValue: number, index: number, count: number) {
  if (count < 1 || value <= 0) return "";
  const center = 64;
  const sweep = (2 * Math.PI) / count;
  const gap = Math.min(0.05, sweep * 0.12);
  const start = -Math.PI / 2 + index * sweep + gap / 2;
  const end = -Math.PI / 2 + (index + 1) * sweep - gap / 2;
  const distance = 48 * Math.sqrt(value / maxValue);
  const first = polarPoint(center, distance, start);
  const last = polarPoint(center, distance, end);
  return "M " + center + " " + center + " L " + first.x + " " + first.y + " A " + distance + " " + distance + " 0 0 1 " + last.x + " " + last.y + " Z";
}

function radarPoint(count: number, distance: number, index: number) {
  return polarPoint(64, distance, -Math.PI / 2 + (2 * Math.PI * index) / Math.max(1, count));
}

function radarPoints(count: number, distance: number, values?: number[], maxValue = 1) {
  if (count < 1) return "";
  return Array.from({ length: count }, (_, index) => {
    const scale = values ? Math.max(0, values[index] ?? 0) / maxValue : 1;
    const point = radarPoint(count, distance * scale, index);
    return point.x + "," + point.y;
  }).join(" ");
}
