"use client";

import Image from "next/image";
import { useState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/app/account/actions";
import { useActionState } from "react";

const initialState: ProfileActionState = { status: "idle", message: "" };

export default function ProfileEditor({
  profile,
}: {
  profile: {
    full_name: string;
    department: string | null;
    year_of_study: number | null;
    avatar_url: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const avatarPreviewIsSafe = isPreviewableAvatar(avatarUrl);
  const initials = profile.full_name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase() ?? "")
    .join("") || "T";

  return (
    <form action={action} className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:items-center">
        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xl font-bold text-white shadow-sm">
          {avatarUrl && avatarPreviewIsSafe ? (
            <Image alt="" aria-hidden="true" className="object-cover" fill sizes="64px" src={avatarUrl} unoptimized />
          ) : initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold">Your profile photo</p>
          <p className="mt-1 text-sm leading-6 text-muted">Add an HTTPS image URL or a site image path. Leave it empty to show your initials.</p>
        </div>
      </div>

      <label className="block space-y-1.5" htmlFor="profile-full-name">
        <span className="text-sm font-semibold">Full name</span>
        <input autoComplete="name" className="input" defaultValue={profile.full_name} id="profile-full-name" maxLength={120} minLength={2} name="full_name" required />
        <span className="block text-xs leading-5 text-muted">This name appears on your account profile and member views.</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5" htmlFor="profile-department">
          <span className="text-sm font-semibold">Department</span>
          <input autoComplete="organization-title" className="input" defaultValue={profile.department ?? ""} id="profile-department" maxLength={120} name="department" placeholder="For example, ECE" />
        </label>
        <label className="block space-y-1.5" htmlFor="profile-year">
          <span className="text-sm font-semibold">Year of study</span>
          <select className="input" defaultValue={profile.year_of_study ?? ""} id="profile-year" name="year_of_study">
            <option value="">Select your year</option>
            {Array.from({ length: 8 }, (_, index) => index + 1).map((year) => (
              <option key={year} value={year}>{`Year ${year}`}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5" htmlFor="profile-avatar-url">
        <span className="text-sm font-semibold">Profile image URL</span>
        <input
          autoComplete="url"
          className="input"
          defaultValue={profile.avatar_url ?? ""}
          id="profile-avatar-url"
          maxLength={500}
          name="avatar_url"
          onChange={(event) => setAvatarUrl(event.target.value.trim())}
          placeholder="https://… or /images/profile.jpg"
          type="text"
          aria-describedby="profile-avatar-help"
        />
        <span id="profile-avatar-help" className="block text-xs leading-5 text-muted">Use a secure HTTPS image URL or a path beginning with /. You can remove it at any time to use your initials.</span>
      </label>

      {state.message && (
        <p aria-live="polite" className={state.status === "error" ? "rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200" : "rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      )}
      <button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Saving profile…" : "Save profile"}
      </button>
    </form>
  );
}

function isPreviewableAvatar(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
