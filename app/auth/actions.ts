"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function signOutAction() {
  const { isAuthenticated, sessionId } = await auth();

  if (isAuthenticated && sessionId) {
    const clerk = await clerkClient();
    await clerk.sessions.revokeSession(sessionId);
  }

  redirect("/auth/sign-in");
}
