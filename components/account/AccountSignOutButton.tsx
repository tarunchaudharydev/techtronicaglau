"use client";

import SignOutButton from "@/components/auth/SignOutButton";
import { LogOut } from "lucide-react";

export default function AccountSignOutButton() {
  return (
    <SignOutButton
      containerClassName="flex flex-col items-end gap-1"
      pendingLabel="Signing out…"
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-wait disabled:opacity-70 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      <LogOut aria-hidden="true" className="size-4" />
      Sign out
    </SignOutButton>
  );
}
