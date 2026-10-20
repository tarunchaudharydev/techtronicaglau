import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Reset password | Techtronica" };

export default function ForgotPasswordPage() {
  redirect("/auth/sign-in");
}
