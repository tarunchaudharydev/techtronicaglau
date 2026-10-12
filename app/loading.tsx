export default function Loading() {
  return (
    <main
      className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-20 pt-8"
      role="status"
      aria-label="Loading page"
    >
      <span className="sr-only">Loading page…</span>
      <div aria-hidden="true" className="animate-pulse space-y-10">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <div className="mx-auto h-3 w-28 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mx-auto h-8 w-3/4 rounded bg-slate-200 dark:bg-slate-700 sm:h-10" />
          <div className="mx-auto h-4 w-full max-w-xl rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mx-auto h-4 w-5/6 max-w-lg rounded bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <article
              key={index}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="h-36 bg-slate-200 dark:bg-slate-800 sm:h-44" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
