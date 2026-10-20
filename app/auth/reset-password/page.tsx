import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Choose a new password | Techtronica" };

export default async function ResetPasswordPage() {
  redirect("/auth/sign-in");
}
