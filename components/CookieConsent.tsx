"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, X } from "lucide-react";

type Consent = { essential: true; analytics: boolean; expiresAt: number };
const CONSENT_VERSION = 1;
const COOKIE_NAME = "techtronica_cookie_consent";
const STORAGE_KEY = "techtronica.cookie-consent";
const MAX_AGE = 60 * 60 * 24 * 365;

function readConsent(): Consent | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { version?: unknown; analytics?: unknown; expiresAt?: unknown };
      if (
        parsed.version === CONSENT_VERSION &&
        typeof parsed.analytics === "boolean" &&
        typeof parsed.expiresAt === "number" &&
        parsed.expiresAt > Date.now()
      ) {
        return { essential: true, analytics: parsed.analytics, expiresAt: parsed.expiresAt };
      }
    }
  } catch {
    // Fall back to the first-party cookie if browser storage is unavailable.
  }

  try {
    const entry = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(COOKIE_NAME + "="));
    const value = entry?.slice(COOKIE_NAME.length + 1);
    const expiry = Date.now() + MAX_AGE * 1000;
    if (value === "v" + CONSENT_VERSION + ":all" || value === "all") {
      return { essential: true, analytics: true, expiresAt: expiry };
    }
    if (value === "v" + CONSENT_VERSION + ":essential" || value === "essential") {
      return { essential: true, analytics: false, expiresAt: expiry };
    }
  } catch {
    // If both storage mechanisms are blocked, the banner remains available.
  }

  return null;
}

export default function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    setConsent(existing);
    setAnalyticsAllowed(existing?.analytics ?? false);
    setReady(true);
  }, []);

  const save = useCallback((analytics: boolean) => {
    const next: Consent = { essential: true, analytics, expiresAt: Date.now() + MAX_AGE * 1000 };
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: CONSENT_VERSION, analytics, expiresAt: next.expiresAt }),
      );
    } catch {
      // The first-party cookie below still stores the choice when possible.
    }
    try {
      document.cookie =
        COOKIE_NAME +
        "=v" +
        CONSENT_VERSION +
        ":" +
        (analytics ? "all" : "essential") +
        "; Max-Age=" +
        MAX_AGE +
        "; Path=/; SameSite=Lax" +
        secure;
    } catch {
      // Keep the choice in component state if the browser blocks cookies.
    }
    setConsent(next);
    setAnalyticsAllowed(analytics);
    setSettingsOpen(false);
  }, []);

  useEffect(() => {
    const openSettings = () => {
      const current = readConsent();
      setConsent(current);
      setAnalyticsAllowed(current?.analytics ?? false);
      setSettingsOpen(true);
    };
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const current = readConsent();
      setConsent(current);
      setAnalyticsAllowed(current?.analytics ?? false);
    };
    window.addEventListener("techtronica:cookie-settings", openSettings);
    window.addEventListener("storage", syncAcrossTabs);
    return () => {
      window.removeEventListener("techtronica:cookie-settings", openSettings);
      window.removeEventListener("storage", syncAcrossTabs);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      {consent?.analytics && <><Analytics /><SpeedInsights /></>}

      {!consent && !settingsOpen && (
        <section role="region" aria-label="Cookie preferences" className="fixed bottom-4 right-4 z-[80] w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-slate-950/95 p-5 text-white shadow-2xl backdrop-blur-lg dark:border-slate-700 sm:bottom-5 sm:right-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-sky-300"><Cookie className="size-5" /></span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold">Your privacy choices</h2>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Essential cookies keep sign-in and site security working. Analytics and performance measurement stay off unless you opt in. Your choice is saved in this browser for up to 12 months, and you can change it any time from Cookie settings. Read our{" "}
                <Link href="/privacy-policy" className="font-semibold underline underline-offset-2 hover:text-white">Privacy Policy</Link>.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => save(false)} className="min-h-10 rounded-full border border-white/30 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Reject optional</button>
            <button type="button" onClick={() => save(true)} className="min-h-10 rounded-full bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Accept all</button>
            <button type="button" onClick={() => setSettingsOpen(true)} className="min-h-10 rounded-full px-3 text-xs font-medium text-sky-200 underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Settings</button>
          </div>
        </section>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-[90] grid place-items-end bg-slate-950/45 p-3 backdrop-blur-sm sm:place-items-center" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title" className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="mb-3 grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200"><Settings2 className="size-5" /></span>
                <h2 id="cookie-settings-title" className="text-lg font-bold text-slate-900 dark:text-white">Cookie settings</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Choose whether to allow analytics and performance measurement. Your choice is saved in this browser for up to 12 months. Essential cookies remain on for sign-in and security.</p>
              </div>
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close cookie settings" className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"><X className="size-4" /></button>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <span><span className="block text-sm font-semibold text-slate-900 dark:text-white">Essential</span><span className="block text-xs text-slate-500">Authentication, preferences and security</span></span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">Always on</span>
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <span><span className="block text-sm font-semibold text-slate-900 dark:text-white">Analytics &amp; performance</span><span className="block text-xs text-slate-500">Vercel Analytics and Speed Insights; enabled only with your permission</span></span>
                <input type="checkbox" checked={analyticsAllowed} onChange={(event) => setAnalyticsAllowed(event.target.checked)} className="size-5 accent-sky-600" />
              </label>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => save(false)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Reject optional</button>
              <button type="button" onClick={() => save(analyticsAllowed)} className="min-h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700">Save preferences</button>
            </div>
          </section>
        </div>
      )}

      {consent && (
        <button type="button" onClick={() => { setAnalyticsAllowed(consent.analytics); setSettingsOpen(true); }} className="fixed bottom-3 left-3 z-[50] grid size-10 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-md transition hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900" aria-label="Open cookie settings" title="Manage cookie choices">
          <Cookie className="size-4" />
        </button>
      )}
    </>
  );
}
