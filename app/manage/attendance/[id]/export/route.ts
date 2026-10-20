import { requireManager } from "@/lib/manage/server";
import type { Tables } from "@/types/database";

export const dynamic = "force-dynamic";

type AttendanceExportRow = Pick<Tables<"meeting_attendance">, "member_name" | "status" | "marked_at">;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, { supabase }] = await Promise.all([params, requireManager("attendance.manage")]);
  const { data: session, error: sessionError } = await supabase
    .from("meeting_attendance_sessions")
    .select("id, name, meeting_date, meeting_time, venue, scope, club_id, clubs(name)")
    .eq("id", id)
    .maybeSingle();

  if (sessionError || !session) return new Response("Attendance sheet not found.", { status: 404 });

  const rows: AttendanceExportRow[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("meeting_attendance")
      .select("member_name, status, marked_at")
      .eq("session_id", id)
      .order("member_name", { ascending: true })
      .order("user_id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) return new Response("Attendance export is unavailable.", { status: 503 });
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  rows.sort((a, b) => Number(a.status === "unmarked") - Number(b.status === "unmarked")
    || a.member_name.localeCompare(b.member_name, "en", { sensitivity: "base" }));

  const club = session.clubs && !Array.isArray(session.clubs) ? session.clubs.name : "";
  const meetingDate = session.meeting_date;
  const meetingTime = session.meeting_time ?? "";
  const output = [
    ["Meeting", "Date (IST)", "Time (IST)", "Scope", "Club", "Venue", "Member", "Attendance", "Marked at (IST)"],
    ...rows.map((row) => [
      session.name, meetingDate, meetingTime, session.scope, club,
      session.venue ?? "", row.member_name, formatAttendanceStatus(row.status), formatMarkedAt(row.marked_at),
    ]),
  ].map((line) => line.map(quoteCsv).join(",")).join("\r\n");

  const safeName = session.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "meeting";
  return new Response("\uFEFF" + output + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="techtronica-attendance-' + meetingDate + "-" + safeName + '.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}

function formatMarkedAt(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? ""
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(date);
}

function formatAttendanceStatus(status: AttendanceExportRow["status"]) {
  if (status === "unmarked") return "Not in meeting (unmarked)";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function quoteCsv(value: string) {
  const safeValue = /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? "'" + value : value;
  return '"' + safeValue.replaceAll('"', '""') + '"';
}
