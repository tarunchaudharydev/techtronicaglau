import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Reset password | Techtronica" };

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot-password" />;
}
