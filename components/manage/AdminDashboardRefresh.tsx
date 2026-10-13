"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

const refreshIntervalMs = 60_000;

export function AdminDashboardRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, refreshIntervalMs);

    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-wait disabled:opacity-60"
      aria-label="Refresh dashboard activity"
    >
      {isPending ? "Refreshing…" : "Refresh"}
    </button>
  );
}
