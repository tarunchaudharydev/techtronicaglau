"use client";

import { useActionState } from "react";
import { decideMembershipAction, type MembershipDecisionState } from "@/app/manage/memberships/actions";

const initialState: MembershipDecisionState = { status: "idle", message: "" };

export default function MembershipDecision({ membershipId }: { membershipId: string }) {
  const [state, action, pending] = useActionState(decideMembershipAction, initialState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="membership_id" type="hidden" value={membershipId} />
      <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50" disabled={pending} name="decision" type="submit" value="active">Approve</button>
      <button className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50" disabled={pending} name="decision" type="submit" value="rejected">Reject</button>
      {state.message && <span aria-live="polite" className={state.status === "error" ? "w-full text-xs text-rose-700" : "w-full text-xs text-emerald-700"} role={state.status === "error" ? "alert" : "status"}>{state.message}</span>}
    </form>
  );
}
