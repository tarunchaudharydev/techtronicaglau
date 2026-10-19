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

type DeviceLocation = { latitude: number; longitude: number };
type PingState = "checking" | "live" | "offline" | "error";

const consentVersion = "network-diagnostics-2026-10-v1";
const pingIntervalMs = 2_000;
const pingTimeoutMs = 5_000;

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
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [pingState, setPingState] = useState<PingState>("checking");
  const [panelVisible, setPanelVisible] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [locationRequest, setLocationRequest] = useState<"idle" | "requesting" | "denied" | "unavailable">("idle");
  const sectionRef = useRef<HTMLElement | null>(null);
  const saveStarted = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) {
      setPanelVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => setPanelVisible(entries[0]?.isIntersecting ?? false),
      { rootMargin: "120px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    const updateOnline = () => setNetwork((current) => ({ ...current, isOnline: navigator.onLine }));
    const updateEstimate = () => {
      const connection = (navigator as NavigatorWithConnection).connection;
      const value = connection?.downlink;
      setDownlinkMbps(typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null);
      setConnectionType(connection?.effectiveType ?? "unavailable");
    };
    const refreshEstimateWhenVisible = () => {
      if (!document.hidden) updateEstimate();
    };

    updateOnline();
    updateEstimate();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    document.addEventListener("visibilitychange", refreshEstimateWhenVisible);
    const connection = (navigator as NavigatorWithConnection).connection;
    connection?.addEventListener("change", updateEstimate);

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
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      document.removeEventListener("visibilitychange", refreshEstimateWhenVisible);
      connection?.removeEventListener("change", updateEstimate);
    };
  }, []);

  useEffect(() => {
    if (!panelVisible) return;

    let active = true;
    let requestInFlight = false;
    let timer: number | undefined;
    let controller: AbortController | null = null;

    const clearTimer = () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    };

    const scheduleNextPing = () => {
      clearTimer();
      if (active && navigator.onLine && !document.hidden) {
        timer = window.setTimeout(() => void measurePing(), pingIntervalMs);
      }
    };

    const measurePing = async () => {
      if (!active || requestInFlight || document.hidden) return;
      if (!navigator.onLine) {
        setPingMs(null);
        setPingState("offline");
        return;
      }

      requestInFlight = true;
      const requestController = new AbortController();
      controller = requestController;
      const timeout = window.setTimeout(() => requestController.abort(), pingTimeoutMs);
      const startedAt = performance.now();

      try {
        // A lightweight static asset reaches the site's edge without invoking a database route.
        const response = await fetch("/logo.png", {
          method: "HEAD",
          cache: "no-store",
          credentials: "same-origin",
          referrerPolicy: "same-origin",
          signal: requestController.signal,
        });
        if (!response.ok) throw new Error("Ping request failed");

        if (active) {
          setPingMs(Math.max(0, Math.round(performance.now() - startedAt)));
          setPingState("live");
        }
      } catch {
        if (active) {
          setPingState(navigator.onLine ? "error" : "offline");
          if (!navigator.onLine) setPingMs(null);
        }
      } finally {
        window.clearTimeout(timeout);
        if (controller === requestController) controller = null;
        requestInFlight = false;
        scheduleNextPing();
      }
    };

    const refreshPing = () => {
      clearTimer();
      if (!requestInFlight) void measurePing();
    };
    const handleOffline = () => {
      clearTimer();
      controller?.abort();
      setPingMs(null);
      setPingState("offline");
    };
    const handleVisibility = () => {
      if (document.hidden) {
        clearTimer();
        controller?.abort();
      } else {
        refreshPing();
      }
    };

    window.addEventListener("online", refreshPing);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    if (navigator.onLine && !document.hidden) {
      void measurePing();
    } else {
      setPingMs(null);
      setPingState("offline");
    }

    return () => {
      active = false;
      clearTimer();
      controller?.abort();
      window.removeEventListener("online", refreshPing);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [panelVisible]);

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

  function requestDeviceLocation() {
    if (!navigator.geolocation) {
      setLocationRequest("unavailable");
      return;
    }

    setLocationRequest("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Keep only coordinates rounded to about 1 km; never send or persist device coordinates.
        setDeviceLocation({
          latitude: Number(position.coords.latitude.toFixed(2)),
          longitude: Number(position.coords.longitude.toFixed(2)),
        });
        setLocationRequest("idle");
      },
      (error) => {
        setLocationRequest(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
  }

  const pingLabel = pingState === "offline"
    ? "Offline"
    : pingMs !== null
      ? pingMs + " ms"
      : pingState === "error"
        ? "Retrying…"
        : "Measuring…";
  const pingHint = pingState === "live"
    ? "HTTP round trip"
    : pingState === "offline"
      ? "Connection unavailable"
      : pingState === "error"
        ? "No response; retrying"
        : "Checking site connection";

  return (
    <section
      ref={sectionRef}
      aria-label="Connection details"
      className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/90"
    >
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
        <Detail label={deviceLocation ? "Device location · rounded" : "Location estimate · IP"}>
          {deviceLocation ? (
            <>
              <strong className="text-slate-800 dark:text-slate-100">
                {deviceLocation.latitude.toFixed(2)}°, {deviceLocation.longitude.toFixed(2)}°
              </strong>
              <button
                type="button"
                onClick={() => { setDeviceLocation(null); setLocationRequest("idle"); }}
                className="mt-1 block text-left text-[10px] font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-300"
              >
                Use IP estimate
              </button>
            </>
          ) : (
            <>
              <strong className="text-slate-800 dark:text-slate-100">
                {network.detailsLoading ? "Checking…" : network.location ?? "Unavailable"}
              </strong>
              <button
                type="button"
                onClick={requestDeviceLocation}
                disabled={locationRequest === "requesting"}
                className="mt-1 block text-left text-[10px] font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900 disabled:cursor-wait disabled:opacity-60 dark:text-sky-300"
              >
                {locationRequest === "requesting" ? "Requesting permission…" : "Improve accuracy"}
              </button>
              {locationRequest === "denied" && (
                <span className="mt-1 block text-[10px] text-amber-700 dark:text-amber-300">
                  Location permission was denied. You can allow it in browser settings.
                </span>
              )}
              {locationRequest === "unavailable" && (
                <span className="mt-1 block text-[10px] text-slate-500">
                  Device location is unavailable in this browser or network.
                </span>
              )}
            </>
          )}
        </Detail>
        <Detail label="Website ping · every 2s">
          <strong className={pingState === "live" ? "text-sky-700 dark:text-sky-300" : pingState === "offline" ? "text-rose-700 dark:text-rose-300" : "text-slate-600 dark:text-slate-300"}>
            {pingLabel}
          </strong>
          <span className="ml-2 text-[10px] text-slate-500 dark:text-slate-400" aria-live="off">
            {pingHint}
          </span>
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
          The website ping checks HTTP round-trip time every two seconds only while this panel is visible. Ping results and device coordinates stay in this page and are not saved.
          If you opt in, we save your account ID when signed in or a temporary guest-session ID, a broad browser-reported speed category, connection type, and approximate country/region.
          The diagnostics database excludes your IP address, city, device coordinates, and ping results. Hosting providers may process IP addresses to deliver the site. The summary is deleted after 30 days.
          {saveState === "saving" && " Saving…"}
          {saveState === "saved" && " Saved for this session."}
          {saveState === "error" && " We could not save it; you can retry by turning this option off and on."}
          {!consent && saveState === "idle" && " Leaving this unchecked keeps the summary off the database."}
          {!deviceLocation && " Device location is requested only when you press Improve accuracy; coordinates are rounded and kept on this page."}
        </p>
      </div>
    </section>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-xs">{children}</div>
    </div>
  );
}
