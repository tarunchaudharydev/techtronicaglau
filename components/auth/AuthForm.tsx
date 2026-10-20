"use client";

import { SignIn, SignUp } from "@clerk/nextjs";

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "reset-password";

export default function AuthForm({ mode, next = "/account" }: { mode: AuthMode; next?: string }) {
  const appearance = { variables: { colorPrimary: "#0284c7", borderRadius: "0.875rem" } };
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-14">
      {mode === "sign-up"
        ? <SignUp routing="hash" signInUrl="/auth/sign-in" fallbackRedirectUrl="/account" appearance={appearance} />
        : <SignIn routing="hash" signUpUrl="/auth/sign-up" fallbackRedirectUrl={next} appearance={appearance} />}
    </main>
  );
}
