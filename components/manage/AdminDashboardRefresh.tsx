"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";


export function AdminDashboardRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
