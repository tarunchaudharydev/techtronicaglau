"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateAccountEmailAction, type ProfileActionState } from "@/app/account/actions";

const initialState: ProfileActionState = { status: "idle", message: "" };

export default function EmailSettingsForm({ currentEmail }: { currentEmail: string }) {
  const [state, action, pending] = useActionState(updateAccountEmailAction, initialState);

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current email</p>
        <p className="mt-1 break-all text-sm font-medium">{currentEmail || "No email address is set"}</p>
      </div>

      <form action={action} className="space-y-4">
        <label className="block space-y-1.5" htmlFor="account-email">
          <span className="text-sm font-medium">New email address</span>
          <input
            autoComplete="email"
            className="input"
            id="account-email"
            maxLength={254}
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>
        <p className="text-sm leading-6 text-muted">
          Supabase will send confirmation email(s) before the address changes. Follow the link(s) to finish the update.
        </p>
        {state.message && (
          <p
            aria-live={state.status === "error" ? "assertive" : "polite"}
            className={state.status === "error" ? "text-sm text-rose-700" : "text-sm text-emerald-700"}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        )}
        <button
          className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Sending confirmation…" : "Update email"}
        </button>
      </form>

      <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
        <h3 className="font-semibold">Password</h3>
        <p className="mt-1 text-sm leading-6 text-muted">Reset your password through a verified link sent to your email address.</p>
        <Link
          className="mt-3 inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold transition hover:border-sky-500 hover:text-sky-700 dark:border-slate-700"
          href="/auth/forgot-password"
        >
          Send password reset link
        </Link>
      </div>
    </div>
  );
}
