"use client";

import { useState } from "react";

const YEARS = Array.from({ length: 8 }, (_, index) => index + 1);

export default function AttendanceAudienceFields({ clubs }: { clubs: Array<{ id: string; name: string }> }) {
  const [scope, setScope] = useState<"society" | "club">("society");

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 sm:p-5" aria-labelledby="attendance-audience-title">
      <div>
        <h3 id="attendance-audience-title" className="text-base font-semibold">Who should be on this roster?</h3>
        <p className="mt-1 text-sm leading-5 text-muted">This roster is saved as a snapshot when you create the sheet.</p>
      </div>
      <label className="block text-sm font-medium">Meeting scope
        <select name="scope" value={scope} onChange={(event) => setScope(event.target.value as "society" | "club")} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <option value="society">Society · all Techtronica profiles</option>
          <option value="club">Club · selected club members</option>
        </select>
      </label>
      {scope === "society" ? (
        <p className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm leading-5 text-sky-950 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100">Every profile in Techtronica will be included, even if the person has no active club membership.</p>
      ) : (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Clubs <span className="font-normal text-muted">(choose one or more)</span></legend>
          {clubs.length ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((club) => (
                <label key={club.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                  <input type="checkbox" name="club_ids" value={club.id} className="size-4 accent-sky-700" />
                  <span>{club.name}</span>
                </label>
              ))}
            </div>
          ) : <p className="text-sm text-muted">There are no active clubs available.</p>}
        </fieldset>
      )}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Student years <span className="font-normal text-muted">(optional)</span></legend>
        <p className="text-xs leading-5 text-muted">Leave all years unchecked to include every year, including profiles with no year set.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {YEARS.map((year) => (
            <label key={year} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
              <input type="checkbox" name="target_years" value={year} className="size-4 accent-sky-700" />
              <span>Year {year}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
