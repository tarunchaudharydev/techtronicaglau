"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import type { Session } from "@clerk/backend";
import { requireManager } from "@/lib/manage/server";

const route = "/manage/users";
const clerkIdPattern = /^user_[a-zA-Z0-9]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteUsers(formData: FormData) {
  await requireManager("admin.manage");
  const raw = formData.get("emails");
  if (typeof raw !== "string") redirect(`${route}?result=invalid`);
  const emails = [...new Set(raw.split(/[\n,;\s]+/).map((email) => email.trim().toLowerCase()).filter(Boolean))];
  if (emails.length < 1 || emails.length > 50 || emails.some((email) => email.length > 254 || !emailPattern.test(email))) {
    redirect(`${route}?result=invalid`);
  }

  try {
    const client = await clerkClient();
    await client.invitations.createInvitationBulk(emails.map((email) => ({
      emailAddress: email,
      redirectUrl: "/auth/sign-up",
    })));
  } catch {
    redirect(`${route}?result=error`);
  }
  revalidatePath(route);
  redirect(`${route}?result=invited&sent=${emails.length}`);
}

export async function changeUserStatus(formData: FormData) {
  await requireManager("admin.manage");
  const id = formData.get("user_id");
  const action = formData.get("action");
  if (typeof id !== "string" || !clerkIdPattern.test(id) || (action !== "ban" && action !== "unban")) redirect(`${route}?result=invalid`);
  const actor = await currentUser();
  if (actor?.id === id) redirect(`${route}?result=self_action`);
  let suspensionPartial = false;
  try {
    const client = await clerkClient();
    if (action === "ban") {
      await client.users.banUser(id);
      try {
        const active = await client.sessions.getSessionList({ userId: id, status: "active", limit: 100 });
        const revocations = await Promise.allSettled(active.data.map((session) => client.sessions.revokeSession(session.id)));
        suspensionPartial = revocations.some((result) => result.status === "rejected");
      } catch {
        suspensionPartial = true;
      }
    } else {
      await client.users.unbanUser(id);
    }
  } catch {
    redirect(`${route}?result=error`);
  }
  revalidatePath(route);
  revalidatePath(`${route}/${id}`);
  if (suspensionPartial) redirect(`${route}?result=suspended_partial`);
  redirect(`${route}?result=saved`);
}

export async function revokeUserSession(formData: FormData) {
  await requireManager("admin.manage");
  const target = formData.get("user_id");
  const sessionId = formData.get("session_id");
  if (typeof target !== "string" || !clerkIdPattern.test(target) || typeof sessionId !== "string" || !/^sess_[a-zA-Z0-9]+$/.test(sessionId)) {
    redirect(`${route}?result=invalid`);
  }
  const client = await clerkClient();
  let session: Session;
  try { session = await client.sessions.getSession(sessionId); }
  catch { redirect(`${route}/${target}?result=error`); }
  if (session.userId !== target) redirect(`${route}/${target}?result=invalid`);
  try { await client.sessions.revokeSession(sessionId); }
  catch { redirect(`${route}/${target}?result=error`); }
  revalidatePath(`${route}/${target}`);
  redirect(`${route}/${target}?result=saved`);
}

