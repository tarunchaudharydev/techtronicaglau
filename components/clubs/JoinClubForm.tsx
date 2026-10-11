"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestClubMembershipAction, type JoinClubState } from "@/app/clubs/[slug]/join/actions";

const initialState: JoinClubState = { status: "idle", message: "" };

export default function JoinClubForm({ clubName, clubSlug }: { clubName: string; clubSlug: string }) {
  const [state, action, pending] = useActionState(requestClubMembershipAction, initialState);

  return (
    <>
      <form action={action}>
        <input name="club_slug" type="hidden" value={clubSlug} />
        {state.message && (
          <p aria-live="polite" className={`mb-4 rounded-xl px-4 py-3 text-sm ${state.status === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`} role={state.status === "error" ? "alert" : "status"}>
            {state.message}
          </p>
        )}
        <button className="block w-full rounded-full bg-sky-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending}>
          {pending ? "Submitting…" : `Request to join ${clubName}`}
        </button>
      </form>
      <div className="mt-6 text-center">
        <Link href={`/clubs/${clubSlug}`} className="text-sm text-muted hover:text-sky-700 hover:underline">← Back to {clubName}</Link>
      </div>
    </>
  );
}
