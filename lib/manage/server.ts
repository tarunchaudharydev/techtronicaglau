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
  // datetime-local values have no timezone. Event forms are explicitly India-local,
  // so attach IST rather than letting the server's timezone silently decide.
  const localMatch = /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})(?::(\\d{2}))?$/.exec(value);
  const date = localMatch
    ? new Date(`${value.length === 16 ? `${value}:00` : value}+05:30`)
    : new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  if (localMatch) {
    const [, year, month, day, hour, minute, second = "00"] = localMatch;
    const check = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
    if (check.getUTCFullYear() !== Number(year) || check.getUTCMonth() !== Number(month) - 1 || check.getUTCDate() !== Number(day) || check.getUTCHours() !== Number(hour) || check.getUTCMinutes() !== Number(minute) || check.getUTCSeconds() !== Number(second)) return null;
  }
  return date.toISOString();
}

export function redirectResult(path: string, result: "saved" | "error" | "invalid" | "conflict" | "invited" | "member_added" | "member_exists" | "member_not_found" | "member_not_verified" | "scope_mismatch" | "role_exists" | "admin_required") {
  redirect(`${path}?result=${result}`);
}
