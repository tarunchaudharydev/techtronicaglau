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

export type BulkInviteResult = { email: string; status: "sent" | "invalid" | "existing" | "failed"; message: string };
export type BulkInviteState = {
  status: "idle" | "complete" | "error";
  message: string;
  results: BulkInviteResult[];
  duplicateCount: number;
  submissionId: number;
};

export async function inviteMultipleUsers(_previousState: BulkInviteState, formData: FormData): Promise<BulkInviteState> {
  const { supabase } = await requireManager("admin.manage");
  const raw = formString(formData, "emails", 4096) ?? "";
  if (!raw) return { status: "error", message: "Enter at least one email address.", results: [], duplicateCount: 0, submissionId: Date.now() };

  const seen = new Set<string>();
  const addresses: string[] = [];
  let duplicateCount = 0;
  for (const token of raw.split(/[\s,;]+/)) {
    const email = token.trim().toLowerCase();
    if (!email) continue;
    if (seen.has(email)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(email);
    addresses.push(email);
  }

  if (addresses.length === 0) return { status: "error", message: "Enter at least one email address.", results: [], duplicateCount, submissionId: Date.now() };
  if (addresses.length > 10) return { status: "error", message: "Send up to 10 unique invitations at a time. No invitations were sent; split the list into smaller batches.", results: [], duplicateCount, submissionId: Date.now() };

  const validEmail = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const results: BulkInviteResult[] = addresses.map((email) => validEmail(email)
    ? { email, status: "failed", message: "Not processed yet" }
    : { email, status: "invalid", message: "Invalid email address" });
  const queue = addresses.flatMap((email, index) => validEmail.test(email) ? [index] : []);
  let nextIndex = 0;

  async function inviteAt(index: number) {
    const email = addresses[index];
    try {
      const { error } = await supabase.functions.invoke("admin-invite-user", { body: { email } });
      if (!error) {
        results[index] = { email, status: "sent", message: "Invitation sent" };
        return;
      }

      let detail = error.message ?? "";
      const context = "context" in error ? error.context : null;
      if (context instanceof Response) {
        const payload = await context.clone().json().catch(() => null) as { error?: unknown } | null;
        if (typeof payload?.error === "string") detail = payload.error;
      }
      if (/already exists|account already/i.test(detail)) {
        results[index] = { email, status: "existing", message: "Account already exists" };
      } else {
        results[index] = { email, status: "failed", message: "Invitation could not be sent" };
      }
    } catch {
      results[index] = { email, status: "failed", message: "Invitation could not be sent" };
    }
  }

  async function worker() {
    while (nextIndex < queue.length) {
      const index = queue[nextIndex++];
      await inviteAt(index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, queue.length) }, () => worker()));

  const sentCount = results.filter(({ status }) => status === "sent").length;
  const existingCount = results.filter(({ status }) => status === "existing").length;
  const invalidCount = results.filter(({ status }) => status === "invalid").length;
  const failedCount = results.filter(({ status }) => status === "failed").length;
  const summary = [
    `${sentCount} invitation${sentCount === 1 ? "" : "s"} sent`,
    existingCount ? `${existingCount} account${existingCount === 1 ? "" : "s"} already existed` : "",
    invalidCount ? `${invalidCount} invalid address${invalidCount === 1 ? "" : "es"}` : "",
    failedCount ? `${failedCount} failed` : "",
    duplicateCount ? `${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"} skipped` : "",
  ].filter(Boolean).join(" · ");

  revalidatePath(route);
  return { status: sentCount === 0 && (invalidCount > 0 || failedCount > 0) ? "error" : "complete", message: summary, results, duplicateCount, submissionId: Date.now() };
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
