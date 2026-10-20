"use server";

import { signOut } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function signOutAction() {
  await signOut();
  redirect("/auth/sign-in");
}
