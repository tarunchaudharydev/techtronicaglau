import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password | Techtronica" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  if (!supabase) return <AuthForm mode="forgot-password" />;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/forgot-password");

  return <AuthForm mode="reset-password" />;
}
