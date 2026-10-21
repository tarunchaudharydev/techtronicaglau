"use client";

import { useState } from "react";

type OverviewDatum = { label: string; count: number | null; unavailable: boolean };
type Workflow = { label: string; stats: OverviewDatum[] };
type ChartMode = "donut" | "polar" | "radar";

const colors = ["#1a73e8", "#5f6368", "#f9ab00", "#12b5cb", "#34a853", "#9aa0a6"];
const chartModes: { id: ChartMode; label: string; accessibleLabel: string }[] = [
  { id: "donut", label: "Donut", accessibleLabel: "Donut chart" },
  { id: "polar", label: "Polar", accessibleLabel: "Polar area chart" },
  { id: "radar", label: "Radar", accessibleLabel: "Radar chart" },
];
const donutRadius = 43;
const donutCircumference = 2 * Math.PI * donutRadius;

export function AdminOverviewDonut({ workflows }: { workflows: Workflow[] }) {
  const [workflowIndex, setWorkflowIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartMode, setChartMode] = useState<ChartMode>("donut");
  const workflow = workflows[workflowIndex] ?? workflows[0];
  const stats = workflow?.stats ?? [];
  const values = stats.map((stat) => stat.unavailable ? 0 : Math.max(0, stat.count ?? 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(1, ...values);
  const selectedIndex = Math.min(activeIndex, Math.max(0, stats.length - 1));
  const active = stats[selectedIndex];
  const activeValue = active?.unavailable ? null : active?.count ?? 0;
  const chartLabel = chartModes.find((mode) => mode.id === chartMode)?.accessibleLabel ?? "Chart";

  return (
    <section aria-labelledby="workflow-volume-title" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="workflow-volume-title" className="text-sm font-semibold text-slate-950 sm:text-base">Workflow volumes</h3>
          <p className="mt-1 text-xs text-slate-500">Choose a workflow to compare its statuses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-600">
            {total.toLocaleString("en-IN")} records
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Chart type">
            {chartModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-label={mode.accessibleLabel}
                aria-pressed={chartMode === mode.id}
                onClick={() => setChartMode(mode.id)}
                className={"min-h-8 rounded-md px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 " + (chartMode === mode.id ? "bg-sky-50 text-sky-800" : "text-slate-600 hover:bg-slate-50")}
              >{mode.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-100 pb-3" role="group" aria-label="Workflow">
        {workflows.map((item, index) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={workflowIndex === index}
            onClick={() => { setWorkflowIndex(index); setActiveIndex(0); }}
            className={"min-h-9 rounded-lg px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 " + (workflowIndex === index ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50")}
          >{item.label}</button>
        ))}
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
        <div className="mx-auto w-32">
          <div className="relative aspect-square w-full">
            <svg
              viewBox="0 0 128 128"
              className="size-full"
              role="img"
              aria-label={chartLabel + " for " + (workflow?.label ?? "workflow") + ": " + stats.map((stat) => stat.label + ": " + (stat.unavailable ? "unavailable" : stat.count ?? 0)).join(", ")}
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
                      stroke={colors[index % colors.length]}
                      strokeWidth="13"
                      strokeDasharray={segmentLength + " " + donutCircumference}
                      strokeDashoffset={-offset}
                      transform="rotate(-90 64 64)" strokeLinecap="round"
                    />;
                  })}
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
            {chartMode === "donut" && <div className="pointer-events-none absolute inset-[25%] grid content-center justify-items-center rounded-full bg-white text-center">
              <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-950">{activeValue === null ? "—" : activeValue.toLocaleString("en-IN")}</span>
              <span className="mt-0.5 max-w-20 text-[10px] font-medium leading-3 text-slate-500">{active?.label ?? "Statuses"}</span>
            </div>}
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-500">{workflow?.label ?? "Workflow"}</p>
        </div>

        <ul className="grid min-w-0 gap-x-3 gap-y-1 sm:grid-cols-2">
          {stats.map((stat, index) => <li key={stat.label}>
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-pressed={selectedIndex === index}
              className={"flex min-h-9 w-full min-w-0 items-center gap-2 rounded-md px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 " + (selectedIndex === index ? "bg-sky-50" : "hover:bg-slate-50")}
            >
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{stat.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{stat.unavailable ? "—" : (stat.count ?? 0).toLocaleString("en-IN")}</span>
            </button>
          </li>)}
        </ul>
      </div>
      <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-4 text-slate-500">
        Statuses are counted separately within the selected workflow. Select a status to view its total; chart values do not animate.
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
