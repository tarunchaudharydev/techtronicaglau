import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Create account | Techtronica" };

export default function SignUpPage() {
  return <AuthForm mode="sign-up" />;
}
