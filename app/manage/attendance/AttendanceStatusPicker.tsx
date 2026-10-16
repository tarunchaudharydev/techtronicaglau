"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMeetingAttendanceStatus } from "./actions";

export type AttendanceStatus = "unmarked" | "present" | "absent" | "excused";

const OPTIONS: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: "present", label: "Present", active: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  { value: "absent", label: "Absent", active: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200" },
  { value: "excused", label: "Excused", active: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" },
  { value: "unmarked", label: "Unmarked", active: "border-slate-400 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" },
];

export default function AttendanceStatusPicker({
  sessionId,
  userId,
  memberName,
  initialStatus,
}: {
  sessionId: string;
  userId: string;
  memberName: string;
  initialStatus: AttendanceStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [savedStatus, setSavedStatus] = useState(initialStatus);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setStatus(initialStatus);
    setSavedStatus(initialStatus);
  }, [initialStatus]);

  function selectStatus(next: AttendanceStatus) {
    if (pending || next === status) return;
    const previous = savedStatus;
    setStatus(next);
    setError("");
    startTransition(async () => {
      const result = await updateMeetingAttendanceStatus(sessionId, userId, next);
      if (!result.ok) {
        setStatus(previous);
        setError(result.message);
        return;
      }
      setSavedStatus(next);
      router.refresh();
    });
  }

  return (
    <div className="min-w-[18rem]">
      <fieldset aria-label={memberName + " attendance"}>
        <legend className="sr-only">{memberName} attendance status</legend>
        <div className="flex flex-wrap gap-1.5">
          {OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition ${status === option.value ? option.active : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"} ${pending ? "cursor-wait opacity-70" : ""}`}
            >
              <input
                type="radio"
                name={`attendance-${sessionId}-${userId}`}
                value={option.value}
                checked={status === option.value}
                disabled={pending}
                onChange={() => selectStatus(option.value)}
                className="size-3.5 accent-sky-700"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <p aria-live="polite" className="mt-1 min-h-4 text-xs text-rose-700 dark:text-rose-300">{pending ? "Saving…" : error}</p>
    </div>
  );
}
