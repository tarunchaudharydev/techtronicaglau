"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function OtherSessionsSettings() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function signOutOtherSessions() {
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      if (!isSupabaseConfigured) {
        setMessage("Session security is temporarily unavailable.");
        return;
      }
      const { error } = await createClient().auth.signOut({ scope: "others" });
      if (error) {
        setMessage("We could not sign out other sessions. Please try again.");
        return;
      }
      setMessage("Other sessions have been revoked. They may remain active until their access tokens expire.");
    } catch {
      setMessage("Session security is temporarily unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <h3 className="font-semibold">Other signed-in devices</h3>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Sign out sessions on other browsers and devices while keeping this session active. Revoked access tokens can remain usable until they expire.</p>
      {message && <p aria-live="polite" className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200" role="status">{message}</p>}
      <button
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-60 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
        disabled={pending}
        onClick={signOutOtherSessions}
        type="button"
      >
        {pending ? "Signing out other devices…" : "Sign out other devices"}
      </button>
    </div>
  );
}
