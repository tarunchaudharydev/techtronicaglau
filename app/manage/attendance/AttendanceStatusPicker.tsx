"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateMeetingAttendanceStatus } from "./actions";

export type AttendanceStatus = "unmarked" | "present" | "absent" | "excused";

const OPTIONS: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: "present", label: "Present", active: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  { value: "absent", label: "Absent", active: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200" },
  { value: "excused", label: "Excused", active: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" },
  { value: "unmarked", label: "Unmarked", active: "border-slate-400 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" },
];

let attendanceRefreshTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAttendanceRefresh(refresh: () => void) {
  if (attendanceRefreshTimer) clearTimeout(attendanceRefreshTimer);
  attendanceRefreshTimer = setTimeout(() => {
    attendanceRefreshTimer = null;
    refresh();
  }, 250);
}

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
  const [saving, setSaving] = useState(false);
  const currentStatusRef = useRef(initialStatus);
  const savedStatusRef = useRef(initialStatus);
  const queuedStatusRef = useRef<AttendanceStatus | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (savingRef.current) return;
    currentStatusRef.current = initialStatus;
    savedStatusRef.current = initialStatus;
    setStatus(initialStatus);
    setSavedStatus(initialStatus);
  }, [initialStatus]);

  function selectStatus(next: AttendanceStatus) {
    if (next === currentStatusRef.current) return;

    // Update the visible value immediately. Save in the background; if the user
    // changes status again while saving, persist only the latest queued choice
    // after the current request finishes.
    currentStatusRef.current = next;
    setStatus(next);
    setError("");
    queuedStatusRef.current = next;
    if (!savingRef.current) void flushQueuedStatus();
  }

  async function flushQueuedStatus() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    let savedAny = false;

    while (queuedStatusRef.current) {
      const requestedStatus = queuedStatusRef.current;
      queuedStatusRef.current = null;

      let result: Awaited<ReturnType<typeof updateMeetingAttendanceStatus>>;
      try {
        result = await updateMeetingAttendanceStatus(sessionId, userId, requestedStatus);
      } catch {
        result = { ok: false, message: "Attendance was not saved. Check your connection and try again." };
      }

      if (result.ok) {
        savedStatusRef.current = requestedStatus;
        setSavedStatus(requestedStatus);
        savedAny = true;
        continue;
      }

      // A newer choice takes precedence over a failed older write.
      if (queuedStatusRef.current) continue;

      currentStatusRef.current = savedStatusRef.current;
      setStatus(savedStatusRef.current);
      setError(result.message);
    }

    savingRef.current = false;
    setSaving(false);
    if (savedAny) scheduleAttendanceRefresh(() => router.refresh());
  }

  return (
    <div className="min-w-[18rem]" aria-busy={saving}>
      <fieldset aria-label={memberName + " attendance"}>
        <legend className="sr-only">{memberName} attendance status</legend>
        <div className="flex flex-wrap gap-1.5">
          {OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition ${status === option.value ? option.active : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}
            >
              <input
                type="radio"
                name={`attendance-${sessionId}-${userId}`}
                value={option.value}
                checked={status === option.value}
                onChange={() => selectStatus(option.value)}
                className="size-3.5 accent-sky-700"
                aria-describedby={error ? `attendance-error-${sessionId}-${userId}` : undefined}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <p
        id={`attendance-error-${sessionId}-${userId}`}
        role={error ? "alert" : "status"}
        aria-live="polite"
        className={`mt-1 flex min-h-4 items-center gap-1 text-xs ${error ? "text-rose-700 dark:text-rose-300" : "text-slate-500"}`}
      >
        {saving && <LoaderCircle className="size-3 animate-spin" />}
        {error || (saving ? "Saving in the background…" : savedStatus === status ? "" : "Saving…")}
      </p>
    </div>
  );
}
