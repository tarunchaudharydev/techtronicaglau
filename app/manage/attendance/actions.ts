"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager, validId } from "@/lib/manage/server";

export async function createMeetingAttendance(formData: FormData) {
  const { supabase } = await requireManager("attendance.manage");
  const name = readField(formData, "name", 120);
  const meetingDate = readField(formData, "meeting_date", 10);
  const meetingTime = readField(formData, "meeting_time", 8);
  const venue = readField(formData, "venue", 240);
  const scope = readField(formData, "scope", 10);
  const clubValue = readField(formData, "club_id", 36);
  const notes = readField(formData, "notes", 2000);

  if (!name || name.length < 2 || !isDate(meetingDate) ||
      (meetingTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(meetingTime)) ||
      (scope !== "society" && scope !== "club") ||
      (scope === "society" && clubValue) ||
      (scope === "club" && !validId(clubValue))) {
    redirect("/manage/attendance?result=invalid");
  }

  const { data, error } = await supabase.rpc("create_meeting_attendance_session", {
    p_name: name,
    p_meeting_date: meetingDate,
    p_meeting_time: meetingTime || null,
    p_venue: venue || null,
    p_scope: scope,
    p_club_id: scope === "club" ? clubValue : null,
    p_notes: notes || null,
  });
  if (error || !data) redirect("/manage/attendance?result=error");

  revalidatePath("/manage/attendance");
  redirect("/manage/attendance/" + data + "?created=1");
}

export async function updateMeetingAttendanceStatus(
  sessionId: string,
  userId: string,
  status: "unmarked" | "present" | "absent" | "excused",
) {
  const { supabase } = await requireManager("attendance.manage");
  if (!validId(sessionId) || !validId(userId) ||
      !["unmarked", "present", "absent", "excused"].includes(status)) {
    return { ok: false as const, message: "Invalid attendance update." };
  }

  const { data, error } = await supabase
    .from("meeting_attendance")
    .update({ status })
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false as const, message: "Attendance was not saved. Check your access and try again." };
  }

  revalidatePath("/manage/attendance/" + sessionId);
  revalidatePath("/manage/attendance");
  return { ok: true as const };
}

function readField(formData: FormData, key: string, maxLength: number): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : null;
}

function isDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
