import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyPermissionKeys } from "@/lib/auth/permissions";
import { getCurrentAppUser } from "@/lib/auth/current-user";

export async function requireManager(permission: string) {
  const supabase = await createClient();
  if (!supabase) redirect("/manage?connection=unavailable");

  const user = await getCurrentAppUser();
  if (!user) redirect("/auth/sign-in?next=/manage");

  const result = await getMyPermissionKeys(supabase, user.id);
  if (result.error) redirect("/manage?permissions=unavailable");
  if (!result.permissionKeys.has(permission) && !result.permissionKeys.has("admin.manage")) {
    redirect("/manage?access=denied");
  }
  return { supabase, user };
}

export function formString(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length <= maxLength
    ? value.trim()
    : null;
}

export function validId(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export function safeSlug(value: string | null): value is string {
  return Boolean(value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100);
}

export function parsedDate(value: string | null) {
  if (!value || value.length > 40) return null;
  // datetime-local values have no offset; interpret them as India Standard Time.
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value)
    ? `${value}+05:30`
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function redirectResult(path: string, result: "saved" | "saved_draft" | "error" | "invalid" | "conflict" | "invited" | "sync_error" | "member_added" | "member_exists" | "member_not_found" | "member_not_verified" | "club_access") {
  redirect(`${path}?result=${result}`);
}
