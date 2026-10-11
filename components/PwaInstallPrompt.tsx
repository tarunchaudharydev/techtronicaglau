"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => setIsInstalled(
      displayMode.matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone),
    );

    const frame = window.requestAnimationFrame(() => {
      setIsIos(ios);
      updateInstalled();
    });
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowIosHelp(false);
    };

    displayMode.addEventListener("change", updateInstalled);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.cancelAnimationFrame(frame);
      displayMode.removeEventListener("change", updateInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isInstalled || dismissed || (!installPrompt && !isIos)) return null;

  async function install() {
    if (!installPrompt) {
      setShowIosHelp(true);
      return;
    }
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
    } finally {
      setInstallPrompt(null);
    }
  }

  return (
    <>
      <aside aria-label="Install Techtronica" className="fixed bottom-20 right-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-sky-100 bg-white/95 p-3 shadow-xl shadow-slate-900/15 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:bottom-8 sm:right-8">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
          <Download aria-hidden="true" size={19} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900 dark:text-white">Techtronica app</span>
          <span className="block text-xs text-slate-600 dark:text-slate-300">Add it to your home screen</span>
        </span>
        <button className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600" onClick={install} type="button">
          {isIos ? "How" : "Install"}
        </button>
        <button aria-label="Dismiss app installation prompt" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setDismissed(true)} type="button">
          <X aria-hidden="true" size={16} />
        </button>
      </aside>

      {showIosHelp && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-slate-950/45 p-4 sm:place-items-center" onClick={(event) => {
          if (event.target === event.currentTarget) setShowIosHelp(false);
        }}>
          <section aria-labelledby="ios-install-title" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900" role="dialog">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">Install on iPhone or iPad</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white" id="ios-install-title">Add Techtronica to your Home Screen</h2>
              </div>
              <button aria-label="Close installation instructions" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setShowIosHelp(false)} type="button">
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <ol className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
              <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200">1</span><span>Open this site in Safari, then tap the <Share aria-label="Share" className="inline-block align-[-3px]" size={16} /> Share button.</span></li>
              <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200">2</span><span>Choose <strong>Add to Home Screen</strong>.</span></li>
              <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200">3</span><span>Tap <strong>Add</strong> to finish.</span></li>
            </ol>
            <button className="mt-6 w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-700" onClick={() => setShowIosHelp(false)} type="button">Got it</button>
          </section>
        </div>
      )}
    </>
  );
}
