import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Sign in | Techtronica" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [params, session] = await Promise.all([searchParams, auth()]);
  const redirectTo = safeRedirectPath(params.next ?? null);
  if (session.userId) redirect(redirectTo);

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-10 sm:py-16">
      <p className="mb-5 max-w-md text-center text-sm leading-6 text-slate-600">
        Sign in with the same Google account you used before. Your existing Techtronica profile and access stay linked to that account.
      </p>
      <SignIn
        routing="hash"
        signUpUrl="/auth/sign-up"
        fallbackRedirectUrl={redirectTo}
        appearance={{ variables: { colorPrimary: "#0284c7", borderRadius: "0.875rem" } }}
      />
    </div>
  );
}
