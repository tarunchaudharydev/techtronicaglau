"use client";

export default function InternshipsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-3xl px-4 py-16"><div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"><h1 className="text-xl font-bold">Internships are temporarily unavailable</h1><p className="mt-2 text-sm">Please try loading the directory again.</p><button type="button" onClick={() => reset()} className="mt-4 min-h-11 rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white">Try again</button></div></main>;
}
