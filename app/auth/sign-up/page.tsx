import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Create account | Techtronica" };

export default function SignUpPage() {
  return (
    <div className="mx-auto flex max-w-5xl justify-center px-4 py-10 sm:py-16">
      <SignUp routing="hash" signInUrl="/auth/sign-in" fallbackRedirectUrl="/account" appearance={{ variables: { colorPrimary: "#0284c7", borderRadius: "0.875rem" } }} />
    </div>
  );
}
