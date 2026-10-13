"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type NetworkState = {
  ip: string | null;
  location: string | null;
  isOnline: boolean;
  detailsLoading: boolean;
};

type NetworkInformation = EventTarget & {
  downlink?: number;
  effectiveType?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

const consentVersion = "network-diagnostics-2026-10-v1";

export default function NetworkDiagnostics() {
  const [network, setNetwork] = useState<NetworkState>({
    ip: null,
    location: null,
    isOnline: true,
    detailsLoading: true,
  });
  const [downlinkMbps, setDownlinkMbps] = useState<number | null>(null);
  const [connectionType, setConnectionType] = useState("unavailable");
  const [consent, setConsent] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveStarted = useRef(false);

  useEffect(() => {
    let active = true;
    const updateOnline = () => setNetwork((current) => ({ ...current, isOnline: navigator.onLine }));
    const updateEstimate = () => {
      const connection = (navigator as NavigatorWithConnection).connection;
      const value = connection?.downlink;
      setDownlinkMbps(typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null);
      setConnectionType(connection?.effectiveType ?? "unavailable");
    };
    const refreshVisibleEstimate = () => {
      if (!document.hidden) updateEstimate();
    };

    updateOnline();
    updateEstimate();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    document.addEventListener("visibilitychange", refreshVisibleEstimate);
    const connection = (navigator as NavigatorWithConnection).connection;
    connection?.addEventListener("change", updateEstimate);
    const timer = window.setInterval(refreshVisibleEstimate, 2000);

    void fetch("/api/network-info", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not read connection details");
        return response.json() as Promise<{ ip: string | null; location: string | null }>;
      })
      .then(({ ip, location }) => {
        if (active) setNetwork((current) => ({ ...current, ip, location, detailsLoading: false }));
      })
      .catch(() => {
        if (active) setNetwork((current) => ({ ...current, detailsLoading: false }));
      });

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      document.removeEventListener("visibilitychange", refreshVisibleEstimate);
      connection?.removeEventListener("change", updateEstimate);
    };
  }, []);

  useEffect(() => {
    if (!consent || downlinkMbps === null || saveStarted.current) return;

    let active = true;
    saveStarted.current = true;
    setSaveState("saving");

    void fetch("/api/network-diagnostics", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consent: true,
        consentVersion,
        downlinkMbps,
        effectiveType: connectionType,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not save diagnostics");
        if (active) setSaveState("saved");
      })
      .catch(() => {
        if (active) {
          saveStarted.current = false;
          setSaveState("error");
        }
      });

    return () => {
      active = false;
    };
  }, [consent, downlinkMbps, connectionType]);

  function updateConsent(enabled: boolean) {
    setConsent(enabled);
    if (!enabled) {
      saveStarted.current = true;
      setSaveState("idle");
    } else {
      saveStarted.current = false;
      setSaveState("idle");
    }
  }

  const speedLabel = downlinkMbps === null
    ? "Not available in this browser"
    : `≈ ${downlinkMbps < 10 ? downlinkMbps.toFixed(1) : Math.round(downlinkMbps)} Mbps`;

  return (
    <section aria-label="Connection details" className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Status">
          <strong className={network.isOnline ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}>
            {network.isOnline ? "Online" : "Offline"}
          </strong>
        </Detail>
        <Detail label="Your IP">
          <strong className="break-all font-mono text-slate-800 dark:text-slate-100">
            {network.detailsLoading ? "Checking…" : network.ip ?? "Unavailable"}
          </strong>
        </Detail>
        <Detail label="Approx. location">
          <strong className="text-slate-800 dark:text-slate-100">
            {network.detailsLoading ? "Checking…" : network.location ?? "Unavailable"}
          </strong>
        </Detail>
        <Detail label="Live speed estimate · 2s refresh">
          <strong className="text-sky-700 dark:text-sky-300">{speedLabel}</strong>
          {connectionType !== "unavailable" && (
            <span className="ml-2 text-[10px] uppercase text-slate-500">{connectionType}</span>
          )}
        </Detail>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
        <label className="flex cursor-pointer items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
          <input
            checked={consent}
            className="mt-0.5 accent-sky-600"
            onChange={(event) => updateConsent(event.target.checked)}
            type="checkbox"
          />
          <span>Optionally save one coarse connection summary for this browser session.</span>
        </label>
        <p className="mt-2 pl-5 text-[11px] leading-5 text-muted">
          The live speed is an estimate provided by your browser, refreshed locally every two seconds; it does not download a speed-test file.
          If you opt in, we save your account ID when signed in or a temporary guest-session ID, a broad speed category, connection type, and approximate country/region.
          The diagnostics database excludes your IP address, city, and exact location. Hosting providers may process IP addresses to deliver the site. The summary is deleted after 30 days.
          {saveState === "saving" && " Saving…"}
          {saveState === "saved" && " Saved for this session."}
          {saveState === "error" && " We could not save it; you can retry by turning this option off and on."}
          {!consent && saveState === "idle" && " Leaving this unchecked keeps the summary off the database."}
        </p>
      </div>
    </section>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 truncate text-xs">{children}</div>
    </div>
  );
}
