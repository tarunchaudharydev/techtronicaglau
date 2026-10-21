"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type AccountOption = {
  id: string;
  fullName: string;
  department: string | null;
  yearOfStudy: number | null;
  avatarUrl: string | null;
};

export default function ProfileAccountPicker({ accounts }: { accounts: AccountOption[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = accounts.find((account) => account.id === selectedId);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleAccounts = normalizedSearch ? accounts.filter((account) => [
      account.fullName,
      account.department ?? "",
      account.yearOfStudy ? `year ${account.yearOfStudy}` : "",
      account.id.slice(-6),
    ].join(" ").toLocaleLowerCase().includes(normalizedSearch)) : accounts;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener("pointerdown", closeOnOutsideClick);
    return () => window.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  function chooseAccount(accountId: string) {
    setSelectedId(accountId);
    setSearch("");
    setOpen(false);
    triggerRef.current?.focus();
  }

  function closeAndFocusTrigger() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="relative" ref={pickerRef}>
      <input name="user_id" type="hidden" value={selectedId} />
      <button
        aria-controls="assignment-account-options"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Person: ${selected?.fullName ?? "Choose an account"}`}
        className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-normal text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        ref={triggerRef}
        type="button"
      >
        {selected ? <AccountAvatar account={selected} key={selected.id} /> : <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">?</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{selected?.fullName ?? "Choose an account"}</span>
          {selected && <span className="block truncate text-xs text-muted">{accountDetails(selected)}</span>}
        </span>
        {selected && <span className="hidden shrink-0 text-xs text-muted sm:inline">…{selected.id.slice(-6)}</span>}
        <svg aria-hidden="true" className="size-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 20 20">
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      </button>

      {open && (
        <div aria-label="Choose an account" className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900" id="assignment-account-options" role="dialog">
          <div className="border-b border-slate-100 p-2 dark:border-slate-800">
            <label className="sr-only" htmlFor="assignment-account-search">Search accounts</label>
            <input
              autoComplete="off"
              autoFocus
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800"
              id="assignment-account-search"
              onChange={(event) => setSearch(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") closeAndFocusTrigger();
              }}
              placeholder="Search name, department, or ID"
              value={search}
            />
          </div>
          <ul aria-label="Accounts" className="max-h-72 overflow-y-auto p-1">
            {visibleAccounts.map((account) => (
              <li key={account.id}>
                <button
                  aria-pressed={selectedId === account.id}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${selectedId === account.id ? "bg-sky-50 dark:bg-sky-950/50" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                  onClick={() => chooseAccount(account.id)}
                  type="button"
                >
                  <AccountAvatar account={account} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">{account.fullName}</span>
                    <span className="block truncate text-xs text-muted">{accountDetails(account)}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">…{account.id.slice(-6)}</span>
                </button>
              </li>
            ))}
            {visibleAccounts.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matching accounts on this page.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function AccountAvatar({ account }: { account: AccountOption }) {
  const [imageFailed, setImageFailed] = useState(false);
  const safeImageUrl = account.avatarUrl && isSafeImageUrl(account.avatarUrl) ? account.avatarUrl : null;
  const initials = account.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]?.toLocaleUpperCase()).join("") || "T";

  return (
    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-sky-100 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
      {safeImageUrl && !imageFailed
        ? <Image alt="" className="size-10 rounded-full object-cover" height={40} onError={() => setImageFailed(true)} referrerPolicy="no-referrer" src={safeImageUrl} unoptimized width={40} />
        : initials}
    </span>
  );
}

function accountDetails(account: AccountOption) {
  return [account.department, account.yearOfStudy ? `Year ${account.yearOfStudy}` : null].filter(Boolean).join(" · ") || "Techtronica account";
}

function isSafeImageUrl(value: string) {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
