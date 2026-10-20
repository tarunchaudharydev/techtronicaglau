"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/app/account/actions";

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

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1.5" htmlFor="profile-full-name">
        <span className="text-sm font-medium">Full name</span>
        <input className="input" defaultValue={profile.full_name} id="profile-full-name" maxLength={120} minLength={2} name="full_name" required />
      </label>
      <label className="block space-y-1.5" htmlFor="profile-department">
        <span className="text-sm font-medium">Department</span>
        <input className="input" defaultValue={profile.department ?? ""} id="profile-department" maxLength={120} name="department" placeholder="For example, Electronics and Communication Engineering" />
      </label>
      <label className="block space-y-1.5" htmlFor="profile-year">
        <span className="text-sm font-medium">Year of study</span>
        <select className="input" defaultValue={profile.year_of_study ?? ""} id="profile-year" name="year_of_study">
          <option value="">Select year</option>
          {Array.from({ length: 8 }, (_, index) => index + 1).map((year) => (
            <option key={year} value={year}>{`Year ${year}`}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5" htmlFor="profile-avatar-url">
        <span className="text-sm font-medium">Profile image URL</span>
        <input className="input" defaultValue={profile.avatar_url ?? ""} id="profile-avatar-url" maxLength={500} name="avatar_url" placeholder="https://… or /images/profile.jpg" type="text" />
      </label>
      <p className="text-xs leading-5 text-muted">Your Google/Clerk profile photo is used when available. Otherwise, use a secure HTTPS image URL or a site path beginning with /; initials appear when neither is available.</p>
      {state.message && (
        <p aria-live="polite" className={state.status === "error" ? "text-sm text-rose-700" : "text-sm text-emerald-700"} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      )}
      <button className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
