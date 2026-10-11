"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formString, redirectResult, requireManager } from "@/lib/manage/server";

export type MembershipDecisionState = { status: "idle" | "success" | "error"; message: string };
const fail = (message: string): MembershipDecisionState => ({ status: "error", message });
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const route = "/manage/memberships";

export async function addSocietyMember(formData: FormData) {
  const { supabase } = await requireManager("admin.manage");
  const email = formString(formData, "email", 254)?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return redirectResult(route, "invalid");
  }

  const { data, error } = await supabase.rpc("admin_add_society_member", { p_email: email });
  if (error) return redirectResult(route, error.code === "P0002" ? "member_not_found" : error.code === "55000" ? "member_not_verified" : "error");

  revalidatePath(route);
  revalidatePath("/account");
  revalidatePath("/manage");
  return redirectResult(route, data === "already_active" ? "member_exists" : "member_added");
}

export async function decideMembershipAction(
  _previousState: MembershipDecisionState,
  formData: FormData,
): Promise<MembershipDecisionState> {
  const idValue = formData.get("membership_id");
  const decisionValue = formData.get("decision");
  const id = typeof idValue === "string" ? idValue : "";
  const decision = typeof decisionValue === "string" ? decisionValue : "";

  if (!uuidPattern.test(id)) return fail("This membership request is not valid.");
  if (decision !== "active" && decision !== "rejected") return fail("Choose approve or reject to continue.");

  const supabase = await createClient();
  if (!supabase) return fail("Membership management is temporarily unavailable.");

  try {
    const { error, data } = await supabase
      .from("memberships")
      .update({ status: decision })
      .eq("id", id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error) return fail("We could not update this request. Refresh and check your assigned scope.");
    if (!data) return fail("This request was already reviewed or is no longer available. Refresh the list.");
  } catch {
    return fail("Membership management is temporarily unavailable. Please try again.");
  }

  revalidatePath("/manage/memberships");
  revalidatePath("/account");
  return { status: "success", message: decision === "active" ? "Membership approved." : "Request rejected." };
}
