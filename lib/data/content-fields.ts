import type { Json } from "@/types/database";

export function contentObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function contentText(value: Json | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function contentList(value: Json | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
