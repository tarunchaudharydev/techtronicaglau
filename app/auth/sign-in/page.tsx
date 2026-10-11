import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Sign in | Techtronica" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthForm mode="sign-in" next={safeRedirectPath(params.next ?? null)} />;
}
