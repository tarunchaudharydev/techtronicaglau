import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Sign in | Techtronica" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto flex max-w-5xl justify-center px-4 py-10 sm:py-16">
      <SignIn routing="hash" signUpUrl="/auth/sign-up" fallbackRedirectUrl={safeRedirectPath(params.next ?? null)} appearance={{ variables: { colorPrimary: "#0284c7", borderRadius: "0.875rem" } }} />
    </div>
  );
}
