"use client";

import { useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export default function AccountSignOutButton() {
  const { signOut } = useClerk();
  const { sessionId } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setError(null);

    try {
      // End this browser's session and navigate away so stale signed-in UI is cleared.
      await signOut({
        sessionId: sessionId ?? undefined,
        redirectUrl: "/auth/sign-in?signed_out=1",
      });
    } catch {
      setIsSigningOut(false);
      setError("We couldn’t sign you out. Check your connection and try again.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        aria-busy={isSigningOut}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-wait disabled:opacity-70 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        <LogOut aria-hidden="true" className="size-4" />
        {isSigningOut ? "Signing out…" : "Sign out"}
      </button>
      {error && <p className="max-w-52 text-right text-xs text-rose-700" role="alert">{error}</p>}
      <span aria-live="polite" className="sr-only" role="status">
        {isSigningOut ? "Signing out of your account" : ""}
      </span>
    </div>
  );
}
