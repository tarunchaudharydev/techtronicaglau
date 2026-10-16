"use client";

import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal } from "lucide-react";

export type AdminDataColumn = {
  key: string;
  label: string;
  defaultVisible?: boolean;
  sortable?: boolean;
};

export type AdminDataRow = {
  id: string;
  searchText: string;
  values: Record<string, string | number | null>;
  cells: Record<string, ReactNode>;
  card: ReactNode;
  actions?: ReactNode;
};

type ViewMode = "auto" | "cards" | "table";
type SortDirection = "asc" | "desc";
const DEFAULT_PAGE_SIZES = [10, 25, 50];

export default function AdminDataTable({
  id,
  columns,
  rows,
  emptyMessage = "No records found.",
  pageSizes = DEFAULT_PAGE_SIZES,
}: {
  id: string;
  columns: AdminDataColumn[];
  rows: AdminDataRow[];
  emptyMessage?: string;
  pageSizes?: number[];
}) {
  const [view, setView] = useState<ViewMode>("auto");
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState(pageSizes[0] ?? 25);
  const [page, setPage] = useState(0);
  const [isNarrow, setIsNarrow] = useState(false);
  const [ready, setReady] = useState(false);

  const columnKeys = columns.map((column) => column.key).join("|");
  const pageSizeKey = pageSizes.join("|");

  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(`admin-table:${id}`); } catch { /* Storage may be disabled. */ }
    if (saved) {
      try {
        const preference = JSON.parse(saved) as { view?: ViewMode; visibleKeys?: string[]; pageSize?: number };
        if (preference.view === "auto" || preference.view === "cards" || preference.view === "table") setView(preference.view);
        if (Array.isArray(preference.visibleKeys)) setVisibleKeys(preference.visibleKeys.filter((key) => columnKeys.split("|").includes(key)));
        if (preference.pageSize && pageSizeKey.split("|").map(Number).includes(preference.pageSize)) setPageSize(preference.pageSize);
      } catch {
        try { window.localStorage.removeItem(`admin-table:${id}`); } catch { /* Ignore unavailable storage. */ }
      }
    }
    setReady(true);
  }, [id, columnKeys, pageSizeKey]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(`admin-table:${id}`, JSON.stringify({ view, visibleKeys, pageSize })); } catch { /* Preferences remain usable for this session. */ }
  }, [id, pageSize, ready, view, visibleKeys]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const shownKeys = useMemo(() => {
    if (!visibleKeys.length) return columns.filter((column) => column.defaultVisible !== false).map((column) => column.key);
    return visibleKeys;
  }, [columns, visibleKeys]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const result = rows.filter((row) => !needle || row.searchText.toLocaleLowerCase().includes(needle));
    if (!sortKey) return result;
    return [...result].sort((left, right) => {
      const a = left.values[sortKey];
      const b = right.values[sortKey];
      const order = typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? order : -order;
    });
  }, [query, rows, sortDirection, sortKey]);

  useEffect(() => setPage(0), [query, pageSize, sortDirection, sortKey]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = filteredRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const resolvedView = view === "auto" ? (isNarrow ? "cards" : "table") : view;
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRow = editingId ? rows.find((row) => row.id === editingId) ?? null : null;

  useEffect(() => {
    if (!editingId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditingId(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [editingId]);

  function handleTableActionClick(event: MouseEvent<HTMLElement>) {
    if (resolvedView !== "table" || !(event.target instanceof Element)) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const row = link.closest("[data-admin-row-id]");
    const rowId = row?.getAttribute("data-admin-row-id");
    if (!rowId || !rows.some((item) => item.id === rowId)) return;
    event.preventDefault();
    setEditingId(rowId);
  }

  function toggleColumn(key: string) {
    setVisibleKeys((current) => {
      const enabled = current.length ? current : columns.filter((column) => column.defaultVisible !== false).map((column) => column.key);
      if (enabled.includes(key)) {
        if (enabled.length === 1) return enabled;
        return enabled.filter((item) => item !== key);
      }
      return [...enabled, key];
    });
  }

  function downloadCsv() {
    const csvColumns = columns.filter((column) => shownKeys.includes(column.key));
    const quote = (value: unknown) => {
      const text = String(value ?? "");
      const safeText = /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? "'" + text : text;
      return '"' + safeText.replaceAll('"', '""') + '"';
    };
    const lines = [
      csvColumns.map((column) => quote(column.label)).join(","),
      ...filteredRows.map((row) => csvColumns.map((column) => quote(row.values[column.key])).join(",")),
    ];
    const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${id}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function toggleSort(key: string) {
    if (sortKey === key) setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  return (
    <section className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5" aria-label="Records" onClick={handleTableActionClick}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block min-w-0 flex-1 lg:max-w-md">
          <span className="sr-only">Search records</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search records…" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-950" />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <details className="relative">
            <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-medium dark:border-slate-700">
              View <ChevronDown aria-hidden="true" className="size-4" />
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {(["auto", "cards", "table"] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => setView(mode)} className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm capitalize hover:bg-slate-100 dark:hover:bg-slate-800" aria-pressed={view === mode}>
                  {mode === "auto" ? "Auto view" : mode === "cards" ? "View cards" : "View table"}
                  {view === mode && <span aria-hidden="true">✓</span>}
                </button>
              ))}
            </div>
          </details>
          <details className="relative">
            <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-medium dark:border-slate-700">
              <SlidersHorizontal aria-hidden="true" className="size-4" /> Columns
            </summary>
            <div className="absolute right-0 z-20 mt-2 max-h-72 w-56 overflow-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {columns.map((column) => (
                <label key={column.key} className="flex cursor-pointer items-center gap-2 py-2 text-sm">
                  <input type="checkbox" checked={shownKeys.includes(column.key)} onChange={() => toggleColumn(column.key)} />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>
          </details>
          <button type="button" onClick={downloadCsv} disabled={!filteredRows.length} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-medium disabled:opacity-50 dark:border-slate-700">
            <Download aria-hidden="true" className="size-4" /> Export CSV
          </button>
        </div>
      </div>

      {resolvedView === "table" ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                {columns.filter((column) => shownKeys.includes(column.key)).map((column) => (
                  <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                    <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-2 hover:text-sky-700" aria-label={`Sort by ${column.label}`}>
                      {column.label}{column.sortable !== false && <span aria-hidden="true">{sortKey === column.key ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>}
                    </button>
                  </th>
                ))}
                {rows.some((row) => row.actions) && <th scope="col" className="px-4 py-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleRows.map((row) => (
                <tr key={row.id} data-admin-row-id={row.id} className="align-top hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  {columns.filter((column) => shownKeys.includes(column.key)).map((column) => <td key={column.key} className="max-w-xs px-4 py-3">{row.cells[column.key] ?? row.values[column.key] ?? "—"}</td>)}
                  {rows.some((item) => item.actions) && <td className="px-4 py-3">{row.actions ?? "—"}</td>}
                </tr>
              ))}
              {!visibleRows.length && <tr><td colSpan={shownKeys.length + 1} className="px-4 py-10 text-center text-muted">{emptyMessage}</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {visibleRows.map((row) => <div key={row.id}>{row.card}</div>)}
          {!visibleRows.length && <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-muted dark:border-slate-700">{emptyMessage}</p>}
        </div>
      )}

      {editingRow && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 pt-[8vh] sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingId(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={id + "-edit-title"}
            className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-2xl border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 id={id + "-edit-title"} className="text-lg font-semibold">Edit record</h2>
              <button type="button" onClick={() => setEditingId(null)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6">{editingRow.card}</div>
          </section>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-muted">
          <label>Rows per page
            <select className="ml-2 min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {[...new Set([...pageSizes, filteredRows.length || pageSizes[0]])].map((size) => <option key={size} value={size}>{size === filteredRows.length ? "All" : size}</option>)}
            </select>
          </label>
          <span aria-live="polite">Showing {filteredRows.length ? currentPage * pageSize + 1 : 0}–{Math.min((currentPage + 1) * pageSize, filteredRows.length)} of {filteredRows.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-300 px-3 disabled:opacity-50 dark:border-slate-700"><ChevronLeft aria-hidden="true" className="size-4" /> Previous</button>
          <span className="min-w-16 text-center">Page {currentPage + 1} of {pageCount}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-300 px-3 disabled:opacity-50 dark:border-slate-700">Next <ChevronRight aria-hidden="true" className="size-4" /></button>
        </div>
      </div>
    </section>
  );
}
