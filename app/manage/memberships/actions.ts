"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { formString, redirectResult, requireManager } from "@/lib/manage/server";

export type MembershipDecisionState = { status: "idle" | "success" | "error"; message: string };
const fail = (message: string): MembershipDecisionState => ({ status: "error", message });
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const route = "/manage/memberships";
const MAX_BULK_INVITES = 50;

export async function addSocietyMember(formData: FormData) {
  const { supabase } = await requireManager("admin.manage");
  const email = formString(formData, "email", 254)?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return redirectResult(route, "invalid");

  let clerkUserId: string | null = null;
  try {
    const clerk = await clerkClient();
    const matches = await clerk.users.getUserList({ emailAddress: [email], limit: 100 });
    const account = matches.data.find((candidate) => candidate.emailAddresses.some((address) =>
      address.emailAddress.toLowerCase() === email && address.verification?.status === "verified",
    ));
    clerkUserId = account?.id ?? null;
  } catch {
    return redirectResult(route, "error");
  }
  if (!clerkUserId) return redirectResult(route, "member_not_verified");

  const { data: profile, error: profileError } = await supabase.from("profiles").select("id").eq("clerk_user_id", clerkUserId).maybeSingle();
  if (profileError) return redirectResult(route, "error");
  if (!profile) return redirectResult(route, "member_not_found");

  const { data, error } = await supabase.rpc("admin_add_clerk_society_member", { p_clerk_user_id: clerkUserId });
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
  await requireManager("admin.manage");
  const raw = formString(formData, "emails", 20000) ?? "";
  const submissionId = Date.now();
  if (!raw) return { status: "error", message: "Enter at least one email address.", results: [], duplicateCount: 0, submissionId };

  const seen = new Set<string>();
  const addresses: string[] = [];
  let duplicateCount = 0;
  for (const token of raw.split(/[\s,;]+/)) {
    const email = token.trim().toLowerCase();
    if (!email) continue;
    if (seen.has(email)) { duplicateCount += 1; continue; }
    seen.add(email);
    addresses.push(email);
  }
  if (!addresses.length) return { status: "error", message: "Enter at least one email address.", results: [], duplicateCount, submissionId };
  if (addresses.length > MAX_BULK_INVITES) {
    return { status: "error", message: `Send up to ${MAX_BULK_INVITES} unique invitations at a time. No invitations were sent; split the list into smaller batches.`, results: [], duplicateCount, submissionId };
  }

  const isValidEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const results: BulkInviteResult[] = addresses.map((email) => isValidEmail(email)
    ? { email, status: "failed", message: "Invitation could not be sent" }
    : { email, status: "invalid", message: "Invalid email address" });
  const validAddresses = addresses.filter(isValidEmail);

  try {
    const clerk = await clerkClient();
    const accounts = validAddresses.length
      ? await clerk.users.getUserList({ emailAddress: validAddresses, limit: 100 })
      : { data: [] };
    const existingUsers = new Set(accounts.data.flatMap((user) => user.emailAddresses.map((address) => address.emailAddress.toLowerCase())));
    for (const email of validAddresses) {
      if (existingUsers.has(email)) {
        const index = addresses.indexOf(email);
        results[index] = { email, status: "existing", message: "Account already exists" };
      }
    }

    const candidates = validAddresses.filter((email) => !existingUsers.has(email));
    const alreadyInvited = new Set<string>();
    for (let start = 0; start < candidates.length; start += 5) {
      const batch = candidates.slice(start, start + 5);
      const invitations = await Promise.all(batch.map((email) => clerk.invitations.getInvitationList({ query: email, limit: 10 })));
      invitations.forEach((response, offset) => {
        const email = batch[offset];
        if (response.data.some((invitation) => invitation.emailAddress.toLowerCase() === email)) alreadyInvited.add(email);
      });
    }
    for (const email of alreadyInvited) {
      results[addresses.indexOf(email)] = { email, status: "existing", message: "Invitation already pending" };
    }

    const toInvite = candidates.filter((email) => !alreadyInvited.has(email));
    if (toInvite.length) {
      const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
      const invitations = await clerk.invitations.createInvitationBulk(toInvite.map((emailAddress) => ({
        emailAddress,
        redirectUrl: `${baseUrl}/auth/sign-up`,
      })));
      const sent = new Set(invitations.map((invitation) => invitation.emailAddress.toLowerCase()));
      for (const email of toInvite) {
        const index = addresses.indexOf(email);
        results[index] = sent.has(email)
          ? { email, status: "sent", message: "Invitation sent" }
          : { email, status: "failed", message: "Invitation could not be sent" };
      }
    }
  } catch {
    // Any Clerk bulk request failure leaves affected entries failed without claiming success.
  }

  const sentCount = results.filter(({ status }) => status === "sent").length;
  const existingCount = results.filter(({ status }) => status === "existing").length;
  const invalidCount = results.filter(({ status }) => status === "invalid").length;
  const failedCount = results.filter(({ status }) => status === "failed").length;
  const summary = [
    `${sentCount} invitation${sentCount === 1 ? "" : "s"} sent`,
    existingCount ? `${existingCount} account or invitation${existingCount === 1 ? "" : "s"} already existed` : "",
    invalidCount ? `${invalidCount} invalid address${invalidCount === 1 ? "" : "es"}` : "",
    failedCount ? `${failedCount} failed` : "",
    duplicateCount ? `${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"} skipped` : "",
  ].filter(Boolean).join(" · ");

  revalidatePath(route);
  revalidatePath("/manage/users");
  return { status: sentCount === 0 && (invalidCount > 0 || failedCount > 0) ? "error" : "complete", message: summary, results, duplicateCount, submissionId };
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
