"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { updatePasswordAction, type ProfileActionState } from "@/app/account/actions";

const initialState: ProfileActionState = { status: "idle", message: "" };

export default function PasswordSettingsForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form action={action} className="mt-6 space-y-4" ref={formRef}>
      <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
        <h3 className="font-semibold">Change password</h3>
        <p className="mt-1 text-sm leading-6 text-muted">Choose a unique password with at least 12 characters. Your password is sent only to Supabase Auth over the existing secure session.</p>
      </div>
      <label className="block space-y-1.5" htmlFor="new-password">
        <span className="text-sm font-medium">New password</span>
        <input autoComplete="new-password" className="input" id="new-password" maxLength={72} minLength={12} name="password" required type="password" />
      </label>
      <label className="block space-y-1.5" htmlFor="confirm-new-password">
        <span className="text-sm font-medium">Confirm new password</span>
        <input autoComplete="new-password" className="input" id="confirm-new-password" maxLength={72} minLength={12} name="confirm_password" required type="password" />
      </label>
      {state.message && (
        <p aria-live={state.status === "error" ? "assertive" : "polite"} className={state.status === "error" ? "rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200" : "rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      )}
      <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-sky-400 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" disabled={pending} type="submit">
        {pending ? "Updating password…" : "Update password"}
      </button>
    </form>
  );
}
