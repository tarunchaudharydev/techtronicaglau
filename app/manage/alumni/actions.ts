"use server";

import { revalidatePath } from "next/cache";
import { formString, redirectResult, requireManager, validId } from "@/lib/manage/server";

const route = "/manage/alumni";

function readAlumni(formData: FormData) {
  const displayName = formString(formData, "display_name", 120);
  const cohort = formString(formData, "cohort", 60);
  const societyRole = formString(formData, "society_role", 120);
  const linkedin = formString(formData, "linkedin_url", 2048) || null;
  const avatar = formString(formData, "uploaded_asset_url", 2048) || formString(formData, "avatar_url", 2048) || null;
  const clubValue = formString(formData, "club_id", 36);
  const clubId = clubValue || null;
  const displayOrder = Number(formString(formData, "display_order", 5) || "0");
  const achievements = (formString(formData, "achievements", 3000) || "").split(/\n+/).map((entry) => entry.trim()).filter(Boolean).slice(0, 30);
  const valid = Boolean(displayName && cohort && societyRole && (!clubId || validId(clubId)) && (!linkedin || /^https:\/\/(www\.)?linkedin\.com\//i.test(linkedin)) && validHttpUrl(avatar) && Number.isInteger(displayOrder) && Math.abs(displayOrder) <= 9999);
  return { valid, payload: {
    display_name: displayName || "",
    cohort: cohort || "",
    society_role: societyRole || "",
    linkedin_url: linkedin,
    avatar_url: avatar,
    club_id: clubId,
    current_role: formString(formData, "current_role", 120) || null,
    current_company: formString(formData, "current_company", 120) || null,
    current_location: formString(formData, "current_location", 120) || null,
    achievements,
    message: formString(formData, "message", 2000) || null,
    display_order: displayOrder,
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") === "on",
  } };
}
function validHttpUrl(value: string | null) { if (!value) return true; try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }

export async function createAlumnus(formData: FormData) {
  const { supabase } = await requireManager("alumni.manage");
  const { payload, valid } = readAlumni(formData);
  if (!valid) return redirectResult(route, "invalid");
  const { error } = await supabase.from("alumni").insert(payload);
  revalidateAlumni();
  return redirectResult(route, error ? "error" : "saved");
}

export async function updateAlumnus(formData: FormData) {
  const { supabase } = await requireManager("alumni.manage");
  const id = formString(formData, "id", 36);
  const { payload, valid } = readAlumni(formData);
  if (!validId(id) || !valid) return redirectResult(route, "invalid");
  const { data, error } = await supabase.from("alumni").update(payload).eq("id", id).select("id").maybeSingle();
  revalidateAlumni();
  return redirectResult(route, error ? "error" : data ? "saved" : "error");
}

export async function deleteAlumnus(formData: FormData) {
  const { supabase } = await requireManager("alumni.manage");
  const id = formString(formData, "id", 36);
  if (!validId(id)) return redirectResult(route, "invalid");
  const { data, error } = await supabase.from("alumni").delete().eq("id", id).select("id").maybeSingle();
  revalidateAlumni();
  return redirectResult(route, error ? "error" : data ? "saved" : "error");
}

function revalidateAlumni() { revalidatePath(route); revalidatePath("/alumni"); }
