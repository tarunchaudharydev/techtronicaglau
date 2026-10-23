import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create account | Techtronica" };

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect("/account");

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-10 sm:py-16">
      <p className="mb-5 max-w-md text-center text-sm leading-6 text-slate-600">
        Already have a Techtronica account? Use the same Google account on the sign-in page; you do not need to create another account.
      </p>
      <SignUp
        routing="hash"
        signInUrl="/auth/sign-in"
        fallbackRedirectUrl="/account"
        appearance={{ variables: { colorPrimary: "#0284c7", borderRadius: "0.875rem" } }}
      />
    </div>
  );
}
