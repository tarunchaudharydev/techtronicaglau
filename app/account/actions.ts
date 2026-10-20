"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = { status: "idle" | "success" | "error"; message: string };
const errorState = (message: string): ProfileActionState => ({ status: "error", message });

function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const fullName = readText(formData, "full_name");
  const department = readText(formData, "department");
  const yearText = readText(formData, "year_of_study");
  const avatarUrl = readText(formData, "avatar_url");
  const year = yearText ? Number(yearText) : null;

  if (fullName.length < 2 || fullName.length > 120) return errorState("Enter a name between 2 and 120 characters.");
  if (department.length > 120) return errorState("Department must be 120 characters or fewer.");
  if (avatarUrl.length > 500 || (avatarUrl && !isSafeAvatarUrl(avatarUrl))) {
    return errorState("Use a secure image URL (https://) or a site-relative path beginning with /.");
  }
  if (year !== null && (!Number.isInteger(year) || year < 1 || year > 8)) {
    return errorState("Study year must be between 1 and 8.");
  }

  const [user, supabase] = await Promise.all([getCurrentAppUser(), createClient()]);
  if (!user) redirect("/auth/sign-in?next=/account");
  if (!supabase) return errorState("Profile updates are temporarily unavailable.");

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, department: department || null, year_of_study: year, avatar_url: avatarUrl || null })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) return errorState("We could not save your profile. Refresh and try again.");
  revalidatePath("/account");
  revalidatePath("/account/settings");
  return { status: "success", message: "Your profile has been updated." };
}

function isSafeAvatarUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
