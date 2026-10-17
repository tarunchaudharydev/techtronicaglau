"use server";

import { revalidatePath, updateTag } from "next/cache";
import { formString, parsedDate, redirectResult, requireManager, safeSlug, validId } from "@/lib/manage/server";

const route = "/manage/events";
const statuses = new Set(["draft", "published", "cancelled", "completed"]);

function readEvent(formData: FormData) {
  const title = formString(formData, "title", 160);
  const slug = formString(formData, "slug", 100)?.toLowerCase() ?? null;
  const clubValue = formString(formData, "club_id", 36);
  const clubId = clubValue || null;
  const startsAt = parsedDate(formString(formData, "starts_at", 40));
  const endsRaw = formString(formData, "ends_at", 40);
  const opensRaw = formString(formData, "registration_opens_at", 40);
  const closesRaw = formString(formData, "registration_closes_at", 40);
  const endsAt = endsRaw ? parsedDate(endsRaw) : null;
  const registrationOpensAt = opensRaw ? parsedDate(opensRaw) : null;
  const registrationClosesAt = closesRaw ? parsedDate(closesRaw) : null;
  const capacityText = formString(formData, "capacity", 8) || "";
  const capacity = capacityText ? Number(capacityText) : null;
  const minTeamText = formString(formData, "min_team_members", 2) || "1";
  const maxTeamText = formString(formData, "max_team_members", 2) || "5";
  const minTeamMembers = Number(minTeamText);
  const maxTeamMembers = Number(maxTeamText);
  const status = formString(formData, "status", 20) || "draft";
  const image = formString(formData, "uploaded_asset_url", 2048) || formString(formData, "cover_image_url", 2048) || null;
  const imageOk = !image || validHttpUrl(image);
  const isPublic = formData.get("is_public") === "on";
  const payload = {
    title: title || "",
    slug: slug || "",
    club_id: clubId,
    summary: formString(formData, "summary", 500) || null,
    description: formString(formData, "description", 12000) || null,
    event_type: formString(formData, "event_type", 80) || null,
    venue: formString(formData, "venue", 240) || null,
    starts_at: startsAt || "",
    ends_at: endsAt,
    registration_opens_at: registrationOpensAt,
    registration_closes_at: registrationClosesAt,
    capacity,
    min_team_members: minTeamMembers,
    max_team_members: maxTeamMembers,
    cover_image_url: image,
    status,
    is_public: isPublic,
  };
  const datesValid = (!endsRaw || endsAt !== null) && (!opensRaw || registrationOpensAt !== null) && (!closesRaw || registrationClosesAt !== null);
  const rangesValid = (!endsAt || !startsAt || new Date(endsAt) >= new Date(startsAt)) && (!registrationClosesAt || !registrationOpensAt || new Date(registrationClosesAt) >= new Date(registrationOpensAt));
  const valid = Boolean(title && title.length >= 3 && safeSlug(slug) && startsAt && datesValid && rangesValid && (capacity === null || (Number.isInteger(capacity) && capacity > 0 && capacity <= 100000)) && Number.isInteger(minTeamMembers) && Number.isInteger(maxTeamMembers) && minTeamMembers >= 1 && maxTeamMembers <= 50 && minTeamMembers <= maxTeamMembers && statuses.has(status) && (!clubId || validId(clubId)) && imageOk);
  return { payload, valid };
}

function validHttpUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

export async function createEvent(formData: FormData) {
  const { supabase, user } = await requireManager("events.manage");
  const { payload, valid } = readEvent(formData);
  if (!valid) return redirectResult(route, "invalid");
  const { error } = await supabase.from("events").insert({ ...payload, created_by: user.id });
  revalidatePath(route);
  revalidatePath("/events");
  if (!error) updateTag("public-events");
  return redirectResult(route, error ? error.code === "23505" ? "conflict" : "error" : "saved");
}

export async function updateEvent(formData: FormData) {
  const { supabase } = await requireManager("events.manage");
  const id = formString(formData, "id", 36);
  const { payload, valid } = readEvent(formData);
  if (!validId(id) || !valid) return redirectResult(route, "invalid");
  const { data, error } = await supabase.from("events").update(payload).eq("id", id).select("id").maybeSingle();
  revalidatePath(route);
  revalidatePath("/events");
  revalidatePath(`/events/${String(formData.get("slug") ?? "")}`);
  if (!error && data) updateTag("public-events");
  return redirectResult(route, error ? error.code === "23505" ? "conflict" : "error" : data ? "saved" : "error");
}

export async function deleteEvent(formData: FormData) {
  const { supabase } = await requireManager("events.manage");
  const id = formString(formData, "id", 36);
  if (!validId(id)) return redirectResult(route, "invalid");
  const { data, error } = await supabase.from("events").delete().eq("id", id).select("id").maybeSingle();
  revalidatePath(route);
  revalidatePath("/events");
  if (!error && data) updateTag("public-events");
  return redirectResult(route, error ? "error" : data ? "saved" : "error");
}
