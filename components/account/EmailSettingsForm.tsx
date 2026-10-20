"use client";

import { UserProfile } from "@clerk/nextjs";

export default function EmailSettingsForm({ currentEmail }: { currentEmail: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current sign-in email</p>
        <p className="mt-1 break-all text-sm font-medium">{currentEmail || "No email address is set"}</p>
      </div>
      <p className="text-sm leading-6 text-muted">Manage your sign-in email, password, verification methods, and active devices through Clerk.</p>
      <div className="overflow-x-auto"><UserProfile routing="hash" /></div>
    </div>
  );
}
