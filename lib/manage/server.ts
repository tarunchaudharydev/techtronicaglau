import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyPermissionKeys } from "@/lib/auth/permissions";

export async function requireManager(permission: string) {
  const supabase = await createClient();
  if (!supabase) redirect("/manage?connection=unavailable");

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/auth/sign-in?next=/manage");

  const result = await getMyPermissionKeys(supabase, data.user.id);
  if (result.error) redirect("/manage?permissions=unavailable");
  if (!result.permissionKeys.has(permission) && !result.permissionKeys.has("admin.manage")) {
    redirect("/manage?access=denied");
  }
  return { supabase, user: data.user };
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
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function redirectResult(path: string, result: "saved" | "error" | "invalid" | "conflict" | "invited" | "member_added" | "member_exists" | "member_not_found" | "member_not_verified" | "scope_mismatch" | "role_exists" | "admin_required") {
  redirect(`${path}?result=${result}`);
}
