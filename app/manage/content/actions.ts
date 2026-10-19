"use server";

import { revalidatePath, updateTag } from "next/cache";
import { formString, redirectResult, requireManager, safeSlug, validId } from "@/lib/manage/server";
import { siteContentTypes, type SiteContentType } from "@/lib/data/public-content";
import type { Json } from "@/types/database";

const route = "/manage/content";

function readRecord(formData: FormData) {
  const contentType = formString(formData, "content_type", 40);
  const slug = formString(formData, "slug", 120);
  const title = formString(formData, "title", 200);
  const rawContent = formString(formData, "content", 65536);
  const displayOrderText = formString(formData, "display_order", 6) || "0";
  const displayOrder = Number(displayOrderText);
  let content: Record<string, Json | undefined> | null = null;

  if (rawContent) {
    try {
      const parsed: unknown = JSON.parse(rawContent);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        content = parsed as Record<string, Json | undefined>;
      }
    } catch {
      content = null;
    }
  }

  const uploadedImage = formString(formData, "uploaded_asset_url", 2048);
  if (uploadedImage && content) {
    const imageField: Partial<Record<SiteContentType, string>> = {
      home_about: "image", home_feature: "image", home_slide: "image", sponsor: "logo_url",
      project: "cover_image", research_work: "image_url", gallery_image: "image_url",
      about_section: "image_url",
    };
    content[imageField[contentType as SiteContentType] ?? "image_url"] = uploadedImage;
  }

  const validType = siteContentTypes.includes(contentType as SiteContentType);
  const valid = Boolean(
    validType && safeSlug(slug) && title && content &&
    new TextEncoder().encode(rawContent || "").byteLength <= 65536 &&
    Number.isInteger(displayOrder) && Math.abs(displayOrder) <= 9999 &&
    validateContent(contentType as SiteContentType, content),
  );

  return {
    valid,
    payload: {
      content_type: contentType as SiteContentType,
      slug: slug || "",
      title: title || "",
      content: content ?? {},
      display_order: displayOrder,
      is_public: formData.get("is_public") === "on",
      is_active: formData.get("is_active") === "on",
    },
  };
}

function validateContent(type: SiteContentType, content: Record<string, Json | undefined>) {
  if (type === "about_section") {
    return typeof content.heading === "string" &&
      (Array.isArray(content.paragraphs) || typeof content.description === "string");
  }
  if (type === "home_feature") {
    const placement = content.placement;
    if (placement === "involvement") {
      return typeof content.title === "string" && Array.isArray(content.items) && content.items.length <= 12;
    }
    if (placement === "core_team_cta") {
      return ["title", "description", "button_label", "href"].every((key) => key in content);
    }
    return ["title", "p1", "p2", "image", "alt"].every((key) => key in content);
  }
  const required: Partial<Record<SiteContentType, string[]>> = {
    home_about: ["description"], home_stat: ["value", "label", "description"],
    home_slide: ["club_slug", "subtitle", "badge", "image"], sponsor: ["logo_url"],
    faq: ["question", "answer"], learning_resource: ["subject", "category", "year", "file_url"],
    project: ["short_description", "status", "year"], research_work: ["kind", "domain", "year"],
    gallery_image: ["image_url", "alt"], library_folder: ["subtitle", "href"],
    about_section: ["heading", "paragraphs"], mission_vision_value: ["label", "text"],
    policy_document: ["sections"],
  };
  return (required[type] ?? []).every((key) => key in content);
}

function refreshContent() {
  updateTag("site-content");
  for (const path of ["/", "/about", "/alumni", "/clubs", "/events", "/faq", "/academics", "/projects", "/research", "/patents", "/library", "/gallery", "/privacy-policy", "/terms", "/refund-policy", "/code-of-conduct"]) {
    revalidatePath(path);
  }
}

export async function createContentRecord(formData: FormData) {
  const { supabase, user } = await requireManager("content.manage");
  const { valid, payload } = readRecord(formData);
  if (!valid) return redirectResult(route, "invalid");
  const { error } = await supabase.from("site_content").insert({
    ...payload,
    created_by: user.id,
    updated_by: user.id,
  });
  refreshContent();
  return redirectResult(route, error ? error.code === "23505" ? "conflict" : "error" : "saved");
}

export async function updateContentRecord(formData: FormData) {
  const { supabase, user } = await requireManager("content.manage");
  const id = formString(formData, "id", 36);
  const { valid, payload } = readRecord(formData);
  if (!validId(id) || !valid) return redirectResult(route, "invalid");
  const { data, error } = await supabase.from("site_content").update({
    ...payload,
    updated_by: user.id,
  }).eq("id", id).select("id").maybeSingle();
  refreshContent();
  return redirectResult(route, error ? error.code === "23505" ? "conflict" : "error" : data ? "saved" : "error");
}

export async function deleteContentRecord(formData: FormData) {
  const { supabase } = await requireManager("content.manage");
  const id = formString(formData, "id", 36);
  if (!validId(id)) return redirectResult(route, "invalid");
  const { data, error } = await supabase.from("site_content").delete().eq("id", id).select("id").maybeSingle();
  refreshContent();
  return redirectResult(route, error ? "error" : data ? "saved" : "error");
}
