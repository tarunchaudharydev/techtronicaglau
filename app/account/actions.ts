"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = { status: "idle" | "success" | "error"; message: string };

const errorState = (message: string): ProfileActionState => ({ status: "error", message });

function readText(formData: FormData, field: string) {
  const value = formData.get(field);
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
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

  if (fullName.length < 2) return errorState("Enter a name with at least 2 characters.");
  if (fullName.length > 120) return errorState("Name must be 120 characters or fewer.");
  if (department.length > 120) return errorState("Department must be 120 characters or fewer.");
  if (avatarUrl.length > 500) return errorState("Image URL must be 500 characters or fewer.");
  if (year !== null && (!Number.isInteger(year) || year < 1 || year > 8)) {
    return errorState("Study year must be between 1 and 8.");
  }
  if (avatarUrl && !isSafeAvatarUrl(avatarUrl)) {
    return errorState("Use a secure image URL (https://) or a site-relative path beginning with /.");
  }

  const supabase = await createClient();
  if (!supabase) return errorState("Profile updates are temporarily unavailable.");

  let userId: string;
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    userId = user?.id ?? "";
    if (authError) userId = "";
  } catch {
    return errorState("We could not verify your session. Refresh and sign in again.");
  }
  if (!userId) redirect("/auth/sign-in?next=/account");

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        department: department || null,
        year_of_study: year,
        avatar_url: avatarUrl || null,
      })
      .eq("id", userId)
      .select("id")
      .maybeSingle();

    if (error) return errorState("We could not save your profile. Refresh the page and try again.");
    if (!data) return errorState("Your profile could not be found. Refresh the page and try again.");
  } catch {
    return errorState("Profile updates are temporarily unavailable. Please try again.");
  }

  revalidatePath("/account");
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

