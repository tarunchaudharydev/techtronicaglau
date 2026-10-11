"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type JoinClubState = { status: "idle" | "success" | "error"; message: string };

const fail = (message: string): JoinClubState => ({ status: "error", message });

export async function requestClubMembershipAction(
  _previousState: JoinClubState,
  formData: FormData,
): Promise<JoinClubState> {
  const slugValue = formData.get("club_slug");
  const slug = typeof slugValue === "string" ? slugValue.trim().toLowerCase() : "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
    return fail("This club link is not valid. Return to the club page and try again.");
  }

  const supabase = await createClient();
  if (!supabase) return fail("Club applications are temporarily unavailable. Please try again later.");

  let userId = "";
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) userId = data.user?.id ?? "";
  } catch {
    return fail("We could not verify your session. Sign in and try again.");
  }
  if (!userId) redirect(`/auth/sign-in?next=${encodeURIComponent(`/clubs/${slug}/join`)}`);

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (clubError || !club) return fail("This club is not accepting applications right now.");

  try {
    const { data: current, error: currentError } = await supabase
      .from("memberships")
      .select("id, status")
      .eq("user_id", userId)
      .eq("club_id", club.id)
      .maybeSingle();
    if (currentError) return fail("We could not check your current membership. Refresh and try again.");
    if (current) {
      return {
        status: "success",
        message: membershipMessage(current.status),
      };
    }
  } catch {
    return fail("We could not check your current membership. Refresh and try again.");
  }

  try {
    const { error } = await supabase.from("memberships").insert({
      user_id: userId,
      club_id: club.id,
      status: "pending",
    });

    if (error?.code === "23505") {
      return { status: "success", message: "Your request is already on file and awaits review." };
    }
    if (error) return fail("We could not submit your request. Please refresh and try again.");
  } catch {
    return fail("We could not submit your request. Please refresh and try again.");
  }

  revalidatePath("/account");
  return { status: "success", message: "Your request was submitted. A club manager will review it." };
}

function membershipMessage(status: string) {
  const messageByStatus: Record<string, string> = {
    pending: "Your request is already awaiting review.",
    active: "You are already an active member of this club.",
    inactive: "You already have a membership record. Contact a club manager if you want to rejoin.",
    rejected: "A previous request was reviewed. Contact a club manager if you need help reapplying.",
  };
  return messageByStatus[status] ?? "A membership record already exists for this club.";
}
