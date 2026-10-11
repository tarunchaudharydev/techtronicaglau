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
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Full name</span>
        <input className="input" defaultValue={profile.full_name} maxLength={120} minLength={2} name="full_name" required />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Department</span>
        <input className="input" defaultValue={profile.department ?? ""} maxLength={120} name="department" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Year of study</span>
        <select className="input" defaultValue={profile.year_of_study ?? ""} name="year_of_study">
          <option value="">Select year</option>
          {Array.from({ length: 8 }, (_, index) => index + 1).map((year) => (
            <option key={year} value={year}>{`Year ${year}`}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Profile image URL</span>
        <input className="input" defaultValue={profile.avatar_url ?? ""} maxLength={500} name="avatar_url" placeholder="https://… or /images/profile.jpg" type="text" />
      </label>
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
