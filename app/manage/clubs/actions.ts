"use server";

import { revalidatePath } from "next/cache";
import { formString, redirectResult, requireManager, safeSlug, validId } from "@/lib/manage/server";
import type { Json } from "@/types/database";

const route = "/manage/clubs";
function readClub(formData: FormData) {
  const name = formString(formData, "name", 100);
  const slug = formString(formData, "slug", 100)?.toLowerCase() ?? null;
  const uploadedImage = formString(formData, "uploaded_asset_url", 2048);
  const logo = formString(formData, "logo_url", 2048) || null;
  const order = Number(formString(formData, "display_order", 5) || "0");
  const tracks = parseObjectList(formString(formData, "tracks", 12000));
  const sessions = parseObjectList(formString(formData, "sessions", 12000));
  const contactLinks = parseObject(formString(formData, "contact_links", 4000));
  const imageUrls = [logo, formString(formData, "hero_image_url", 2048), formString(formData, "gallery_image_url", 2048), formString(formData, "session_image_url", 2048), formString(formData, "homepage_image_url", 2048), formString(formData, "promo_video_url", 2048)];
  const valid = Boolean(name && name.length >= 2 && safeSlug(slug) && imageUrls.every(validAssetUrl) && tracks && sessions && contactLinks && Number.isInteger(order) && Math.abs(order) <= 9999);
  return { valid, payload: {
    name: name || "", slug: slug || "", tagline: formString(formData, "tagline", 180) || null,
    description: formString(formData, "description", 3000) || null,
    purpose_title: formString(formData, "purpose_title", 180) || null,
    purpose_description: formString(formData, "purpose_description", 5000) || null,
    focus_areas: (formString(formData, "focus_areas", 1000) || "").split(",").map((area) => area.trim()).filter(Boolean).slice(0, 20),
    logo_url: uploadedImage || logo, hero_image_url: uploadedImage || formString(formData, "hero_image_url", 2048) || null,
    gallery_image_url: formString(formData, "gallery_image_url", 2048) || null,
    session_image_url: formString(formData, "session_image_url", 2048) || null,
    promo_video_url: formString(formData, "promo_video_url", 2048) || null,
    homepage_image_url: uploadedImage || formString(formData, "homepage_image_url", 2048) || null,
    homepage_subtitle: formString(formData, "homepage_subtitle", 180) || null,
    homepage_badge: formString(formData, "homepage_badge", 180) || null,
    tracks, activities: (formString(formData, "activities", 3000) || "").split(/\n+/).map((entry) => entry.trim()).filter(Boolean).slice(0, 30),
    sessions, contact_links: contactLinks, display_order: order, is_active: formData.get("is_active") === "on",
  } };
}
function validAssetUrl(value: string | null) { if (!value) return true; if (value.startsWith("/") && !value.startsWith("//")) return true; try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
function parseObjectList(raw: string | null): Json[] | null {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length <= 30 && parsed.every((entry) =>
      entry && typeof entry === "object" && !Array.isArray(entry) &&
      typeof entry.title === "string" && typeof entry.description === "string",
    ) ? parsed as Json[] : null;
  } catch { return null; }
}
function parseObject(raw: string | null): Json | null {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Json : null;
  } catch { return null; }
}
function refresh(slug?: string) { revalidatePath(route); revalidatePath("/clubs"); revalidatePath("/manage"); if (slug) revalidatePath(`/clubs/${slug}`); }

export async function createClub(formData: FormData) {
  const { supabase } = await requireManager("clubs.manage");
  const { valid, payload } = readClub(formData);
  if (!valid) return redirectResult(route, "invalid");
  const { error } = await supabase.from("clubs").insert(payload);
  refresh(payload.slug);
  return redirectResult(route, error ? error.code === "23505" ? "conflict" : "error" : "saved");
}
export async function updateClub(formData: FormData) {
  const { supabase } = await requireManager("clubs.manage");
  const id = formString(formData, "id", 36);
  const { valid, payload } = readClub(formData);
  if (!validId(id) || !valid) return redirectResult(route, "invalid");
  const { data, error } = await supabase.from("clubs").update(payload).eq("id", id).select("id").maybeSingle();
  refresh(payload.slug);
  return redirectResult(route, error ? error.code === "23505" ? "conflict" : "error" : data ? "saved" : "error");
}
