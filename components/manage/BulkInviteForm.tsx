"use client";

import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle, MailPlus } from "lucide-react";
import { inviteMultipleUsers, type BulkInviteState } from "@/app/manage/memberships/actions";

const initialState: BulkInviteState = {
  status: "idle",
  message: "",
  results: [],
  duplicateCount: 0,
  submissionId: 0,
};

const fieldClass = "mt-1 block min-h-32 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 sm:text-sm";

export default function BulkInviteForm() {
  const [state, formAction, pending] = useActionState(inviteMultipleUsers, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "complete") formRef.current?.reset();
  }, [state.submissionId, state.status]);

  return (
    <form action={formAction} ref={formRef} className="mt-4">
      <label className="block text-sm font-medium" htmlFor="bulk-invite-emails">
        Email addresses
        <textarea
          className={fieldClass}
          id="bulk-invite-emails"
          name="emails"
          required
          maxLength={20000}
          placeholder={"student1@example.com\nstudent2@example.com\nstudent3@example.com"}
          aria-describedby="bulk-invite-help"
          disabled={pending}
        />
      </label>
      <p id="bulk-invite-help" className="mt-2 text-xs leading-5 text-muted">
        Add up to 50 email addresses, separated by new lines, commas, or semicolons. Duplicate addresses are sent once. Each person gets a private setup link and chooses their own password; passwords are never shown to administrators.
      </p>
      <button
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        type="submit"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : <MailPlus aria-hidden="true" className="size-4" />}
        {pending ? "Sending invitations…" : "Send invitations"}
      </button>

      {state.message && (
        <div className={`mt-4 rounded-xl border p-3 text-sm leading-5 ${state.status === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-sky-200 bg-sky-50 text-sky-900"}`} role={state.status === "error" ? "alert" : "status"} aria-live="polite">
          <p className="font-semibold">{state.message}</p>
          {state.results.length > 0 && (
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto border-t border-current/10 pt-2">
              {state.results.map((result, index) => (
                <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5" key={`${result.email}-${index}`}>
                  <span className="break-all">{result.email}</span>
                  <span className="font-medium">{result.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
