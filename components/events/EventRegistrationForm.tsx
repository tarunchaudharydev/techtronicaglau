"use client";

import { useState } from "react";
import PendingSubmitButton from "@/components/ui/PendingSubmitButton";

type Member = { fullName: string; email: string; year: string; branch: string; section: string };
type Props = {
  action: (formData: FormData) => void | Promise<void>;
  eventId: string;
  slug: string;
  minMembers: number;
  maxMembers: number;
};

export default function EventRegistrationForm({ action, eventId, slug, minMembers, maxMembers }: Props) {
  const safeMin = Math.min(50, Math.max(1, minMembers));
  const safeMax = Math.min(50, Math.max(safeMin, maxMembers));
  const [members, setMembers] = useState<Member[]>(() => Array.from({ length: safeMin }, blankMember));

  function update(index: number, field: keyof Member, value: string) {
    setMembers((current) => current.map((member, memberIndex) => memberIndex === index ? { ...member, [field]: value } : member));
  }

  return (
    <form action={action} className="mt-5 space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Team members</h3>
          <p className="text-sm text-muted">Enter details for every teammate, including yourself.</p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-800">{members.length} / {safeMax}</span>
      </div>
      {members.map((member, index) => (
        <fieldset key={index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-semibold">Member {index + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Full name<input required name="member_name" autoComplete="name" maxLength={120} value={member.fullName} onChange={(event) => update(index, "fullName", event.target.value)} className={inputClass} /></label>
            <label className="text-sm">Email<input required name="member_email" type="email" autoComplete="email" maxLength={254} value={member.email} onChange={(event) => update(index, "email", event.target.value)} className={inputClass} /></label>
            <label className="text-sm">Year of study<select required name="member_year" value={member.year} onChange={(event) => update(index, "year", event.target.value)} className={inputClass}><option value="">Select year</option>{[1,2,3,4,5,6,7,8].map((year) => <option key={year} value={year}>{year}{year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} year</option>)}</select></label>
            <label className="text-sm">Branch / department<input required name="member_branch" maxLength={100} value={member.branch} onChange={(event) => update(index, "branch", event.target.value)} className={inputClass} /></label>
            <label className="text-sm sm:col-span-2">Section<input required name="member_section" maxLength={50} value={member.section} onChange={(event) => update(index, "section", event.target.value)} className={inputClass} /></label>
          </div>
          {members.length > safeMin && <button type="button" onClick={() => setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index))} className="mt-3 text-sm font-semibold text-rose-700 underline">Remove member {index + 1}</button>}
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={members.length >= safeMax} onClick={() => setMembers((current) => [...current, blankMember()])} className="rounded-full border border-sky-300 px-4 py-2 text-sm font-semibold text-sky-800 disabled:cursor-not-allowed disabled:opacity-50">Add teammate</button>
        <p className="text-xs text-muted">Allowed team size: {safeMin}–{safeMax}.</p>
      </div>
      <PendingSubmitButton type="submit" className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">Register team</PendingSubmitButton>
    </form>
  );
}

function blankMember(): Member { return { fullName: "", email: "", year: "", branch: "", section: "" }; }
const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white";