"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { formString, requireManager, validId } from "@/lib/manage/server";

const route = "/manage/team";
const kinds = new Set(["team", "mentor", "faculty"]);

function readMember(formData: FormData) {
  const name = formString(formData, "display_name", 120);
  const title = formString(formData, "title", 120);
  const kind = formString(formData, "member_type", 20) || "team";
  const clubValue = formString(formData, "club_id", 36);
  const clubId = clubValue || null;
  const uploadedAvatar = formString(formData, "uploaded_asset_url", 2048);
  const avatar = uploadedAvatar || formString(formData, "avatar_url", 2048) || null;
  const linkedin = formString(formData, "linkedin_url", 2048) || null;
  const contact = formString(formData, "public_contact_url", 2048) || null;
  const birthdayMonth = formString(formData, "birthday_month", 2);
  const birthdayDay = formString(formData, "birthday_day", 2);
  const month = birthdayMonth ? Number(birthdayMonth) : null;
  const day = birthdayDay ? Number(birthdayDay) : null;
  const displayOrder = Number(formString(formData, "display_order", 5) || "0");
  const roles = parseList(formString(formData, "roles", 500));
  const categories = parseList(formString(formData, "categories", 500));
  const biography = (formString(formData, "biography", 5000) || "").split(/\n+/).map((text) => text.trim()).filter(Boolean).map((text) => ({ text, bold: false }));
  const isPublic = formData.get("is_public") === "on";
  const validAvatar = avatar?.startsWith("storage://member-media/")
    ? !isPublic && /^storage:\/\/member-media\/team\/[a-z0-9_-]+\/[a-z0-9-]+\.[a-z0-9]+$/i.test(avatar)
    : validOptionalUrl(avatar);
  const valid = Boolean(name && title && kinds.has(kind) && (!clubId || validId(clubId)) && validAvatar && validLinkedIn(linkedin) && validOptionalUrl(contact) && Number.isInteger(displayOrder) && Math.abs(displayOrder) <= 9999 && (!month && !day || Boolean(month && month >= 1 && month <= 12 && day && day >= 1 && day <= daysInMonth(month))));
  return {
    valid,
    payload: {
      display_name: name || "",
      title: title || "",
      member_type: kind,
      club_id: clubId,
      avatar_url: avatar,
      linkedin_url: linkedin,
      public_contact_url: contact,
      birthday_month: month,
      birthday_day: day,
      display_order: displayOrder,
      roles,
      categories,
      summary: formString(formData, "summary", 500) || "",
      biography,
      is_public: isPublic,
      is_active: formData.get("is_active") === "on",
    },
  };
}

function parseList(value: string | null) { return (value || "").split(",").map((part) => part.trim()).filter(Boolean).slice(0, 20); }
function validOptionalUrl(value: string | null) { if (!value) return true; try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }
function validLinkedIn(value: string | null) { return !value || /^https:\/\/(www\.)?linkedin\.com\//i.test(value); }
function daysInMonth(month: number) { return month === 2 ? 29 : [4, 6, 9, 11].includes(month) ? 30 : 31; }

export async function createTeamMember(formData: FormData) {
  const { supabase } = await requireManager("team.manage");
  const { payload, valid } = readMember(formData);
  if (!valid) return redirectTeamResult(formData, "invalid");
  const { error } = await supabase.from("team_members").insert(payload);
  revalidateTeam();
  return redirectTeamResult(formData, error ? "error" : "saved");
}

export async function updateTeamMember(formData: FormData) {
  const { supabase } = await requireManager("team.manage");
  const id = formString(formData, "id", 36);
  const { payload, valid } = readMember(formData);
  if (!validId(id) || !valid) return redirectTeamResult(formData, "invalid");
  const { data, error } = await supabase.from("team_members").update(payload).eq("id", id).select("id").maybeSingle();
  revalidateTeam();
  return redirectTeamResult(formData, error ? "error" : data ? "saved" : "error");
}

export async function deleteTeamMember(formData: FormData) {
  const { supabase } = await requireManager("team.manage");
  const id = formString(formData, "id", 36);
  if (!validId(id)) return redirectTeamResult(formData, "invalid");
  const { data, error } = await supabase.from("team_members").delete().eq("id", id).select("id").maybeSingle();
  revalidateTeam();
  return redirectTeamResult(formData, error ? "error" : data ? "saved" : "error");
}

function redirectTeamResult(formData: FormData, result: "saved" | "error" | "invalid") {
  const query = new URLSearchParams({ result });
  const search = formString(formData, "search", 80);
  const page = formString(formData, "page", 7);
  if (search) query.set("search", search);
  if (page && /^\d+$/.test(page) && Number(page) > 1) query.set("page", String(Math.min(Number(page), 1_000_000)));
  redirect(`${route}?${query.toString()}`);
}

function revalidateTeam() {
  updateTag("public-team");
  revalidatePath(route);
  revalidatePath("/about");
  revalidatePath("/", "page");
}
