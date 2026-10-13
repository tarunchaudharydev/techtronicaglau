"use client";

import { useEffect, useState } from "react";

type NetworkState = {
  ip: string | null;
  isOnline: boolean;
  ipLoading: boolean;
  ipError: boolean;
};

const initialState: NetworkState = {
  ip: null,
  isOnline: true,
  ipLoading: true,
  ipError: false,
};

export default function NetworkDiagnostics() {
  const [network, setNetwork] = useState(initialState);
  const [speed, setSpeed] = useState<string | null>(null);
  const [speedError, setSpeedError] = useState(false);
  const [checkingSpeed, setCheckingSpeed] = useState(false);

  useEffect(() => {
    let active = true;
    const updateOnline = () => setNetwork((current) => ({ ...current, isOnline: navigator.onLine }));
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    void fetch("/api/network-info", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not read connection details");
        return response.json() as Promise<{ ip: string | null }>;
      })
      .then(({ ip }) => {
        if (active) setNetwork((current) => ({ ...current, ip, ipLoading: false }));
      })
      .catch(() => {
        if (active) setNetwork((current) => ({ ...current, ipLoading: false, ipError: true }));
      });

    return () => {
      active = false;
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  async function measureSpeed() {
    if (checkingSpeed || !navigator.onLine) return;
    setCheckingSpeed(true);
    setSpeed(null);
    setSpeedError(false);

    const startedAt = performance.now();
    try {
      const response = await fetch(`/api/network-test?run=${Date.now()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok || !response.body) throw new Error("Speed check unavailable");

      const reader = response.body.getReader();
      let receivedBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedBytes += value.byteLength;
      }
      const elapsedMs = Math.max(performance.now() - startedAt, 1);
      if (receivedBytes === 0) throw new Error("No data received");

      const megabitsPerSecond = (receivedBytes * 8) / (elapsedMs * 1000);
      setSpeed(`${megabitsPerSecond < 10 ? megabitsPerSecond.toFixed(1) : Math.round(megabitsPerSecond)} Mbps`);
    } catch {
      setSpeedError(true);
    } finally {
      setCheckingSpeed(false);
    }
  }

  return (
    <section aria-label="Your connection" className="mb-5 rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
          <span>
            Status:{" "}
            <strong className={network.isOnline ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}>
              {network.isOnline ? "Online" : "Offline"}
            </strong>
          </span>
          <span>
            Your IP:{" "}
            <strong className="font-mono font-semibold text-slate-800 dark:text-slate-100">
              {network.ipLoading ? "Checking…" : network.ip ?? (network.ipError ? "Unavailable" : "Not available")}
            </strong>
          </span>
          {speed && <span>Speed to this site: <strong className="text-sky-700 dark:text-sky-300">{speed}</strong></span>}
        </div>

        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-wait disabled:opacity-70 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-950"
          disabled={checkingSpeed || !network.isOnline}
          onClick={measureSpeed}
          type="button"
        >
          {checkingSpeed && <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />}
          {checkingSpeed ? "Measuring…" : speed ? "Check again" : "Check speed"}
        </button>
      </div>

      <p aria-live="polite" className="mt-3 text-[11px] leading-5 text-muted">
        The speed check downloads 2 MiB only when you choose it and measures the connection to this website. {speedError ? "The check failed; please retry when your connection is available." : "Your IP is shown only in your browser and is not stored by this app."}
      </p>
    </section>
  );
}
