"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
  type AuthActionState,
} from "@/app/auth/actions";

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "reset-password";

const initialState: AuthActionState = { status: "idle", message: "" };

const authCopy: Record<AuthMode, { title: string; description: string }> = {
  "sign-in": {
    title: "Welcome back",
    description: "Sign in to manage your Techtronica account and club activity.",
  },
  "sign-up": {
    title: "Create your account",
    description: "Register with email and password. A normal account does not grant society membership or a role.",
  },
  "forgot-password": {
    title: "Reset your password",
    description: "We’ll send a reset link if an account uses that email address.",
  },
  "reset-password": {
    title: "Choose a new password",
    description: "Use at least 12 characters. A password manager is recommended.",
  },
};

export default function AuthForm({
  mode,
  next = "/account",
}: {
  mode: AuthMode;
  next?: string;
}) {
  const actionByMode = {
    "sign-in": signInAction,
    "sign-up": signUpAction,
    "forgot-password": requestPasswordResetAction,
    "reset-password": updatePasswordAction,
  } as const;
  const [state, formAction, pending] = useActionState(actionByMode[mode], initialState);
  const copy = authCopy[mode];

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-14">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-sky-950/5 sm:p-9 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
          Techtronica · Member access
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {copy.description}
        </p>

        <form action={formAction} className="mt-7 space-y-4">
          {mode === "sign-up" && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Full name</span>
              <input
                autoComplete="name"
                className="input"
                maxLength={120}
                minLength={2}
                name="full_name"
                required
              />
            </label>
          )}

          {mode !== "reset-password" && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <input
                autoComplete="email"
                className="input"
                maxLength={254}
                name="email"
                required
                type="email"
              />
            </label>
          )}

          {(mode === "sign-in" || mode === "sign-up" || mode === "reset-password") && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Password</span>
              <input
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                className="input"
                maxLength={72}
                minLength={mode === "sign-in" ? 1 : 12}
                name="password"
                required
                type="password"
              />
            </label>
          )}

          {(mode === "sign-up" || mode === "reset-password") && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Confirm password</span>
              <input
                autoComplete="new-password"
                className="input"
                maxLength={72}
                minLength={12}
                name="confirm_password"
                required
                type="password"
              />
            </label>
          )}

          {mode === "sign-in" && <input name="next" type="hidden" value={next} />}

          {state.message && (
            <p
              aria-live="polite"
              className={`rounded-xl px-4 py-3 text-sm ${
                state.status === "error"
                  ? "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                  : "bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
              }`}
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.message}
            </p>
          )}

          <button
            className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Please wait…" : submitLabel(mode)}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
          {mode === "sign-in" && (
            <>
              <Link className="font-medium text-sky-700 hover:underline dark:text-sky-300" href="/auth/forgot-password">
                Forgot password?
              </Link>
              <Link className="font-medium text-sky-700 hover:underline dark:text-sky-300" href="/auth/sign-up">
                Create an account
              </Link>
            </>
          )}
          {mode === "sign-up" && (
            <Link className="font-medium text-sky-700 hover:underline dark:text-sky-300" href="/auth/sign-in">
              Already registered? Sign in
            </Link>
          )}
          {mode === "forgot-password" && (
            <Link className="font-medium text-sky-700 hover:underline dark:text-sky-300" href="/auth/sign-in">
              Back to sign in
            </Link>
          )}
          {mode === "reset-password" && (
            <Link className="font-medium text-sky-700 hover:underline dark:text-sky-300" href="/auth/forgot-password">
              Request another reset link
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

function submitLabel(mode: AuthMode) {
  switch (mode) {
    case "sign-in":
      return "Sign in";
    case "sign-up":
      return "Create account";
    case "forgot-password":
      return "Send reset link";
    case "reset-password":
      return "Update password";
  }
}
