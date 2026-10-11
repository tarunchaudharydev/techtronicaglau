"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const invalidInput = (message: string): AuthActionState => ({ status: "error", message });
const passwordMinLength = 12;
const passwordMaxLength = 72;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEmail(formData: FormData) {
  const email = formData.get("email");
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function readPassword(formData: FormData, field = "password") {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readEmail(formData);
  const password = readPassword(formData);
  const next = safeRedirectPath(
    typeof formData.get("next") === "string" ? String(formData.get("next")) : null,
  );

  if (!emailPattern.test(email) || !password) {
    return invalidInput("Enter a valid email address and password.");
  }

  const supabase = await createClient();
  if (!supabase) {
    return invalidInput("Account sign-in is temporarily unavailable. Please try again later.");
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return invalidInput("We could not sign you in with those details. Check them and try again.");
    }
  } catch {
    return invalidInput("Sign-in is temporarily unavailable. Please try again.");
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = formData.get("full_name");
  const fullName = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  const email = readEmail(formData);
  const password = readPassword(formData);
  const confirmPassword = readPassword(formData, "confirm_password");

  if (fullName.length < 2 || fullName.length > 120) {
    return invalidInput("Enter your full name (2–120 characters).");
  }
  if (!emailPattern.test(email) || email.length > 254) {
    return invalidInput("Enter a valid email address.");
  }
  const passwordBytes = new TextEncoder().encode(password).length;
  if (password.length < passwordMinLength || passwordBytes > passwordMaxLength) {
    return invalidInput(`Use a password between ${passwordMinLength} and ${passwordMaxLength} characters.`);
  }
  if (password !== confirmPassword) {
    return invalidInput("The passwords do not match.");
  }

  const supabase = await createClient();
  if (!supabase) {
    return invalidInput("Account registration is temporarily unavailable. Please try again later.");
  }

  let signupFailed = false;
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${siteUrl()}/auth/callback?next=/account`,
      },
    });
    signupFailed = Boolean(error);
  } catch {
    signupFailed = true;
  }

  if (signupFailed) {
    return {
      status: "success",
      message: "If this address can be registered, you will receive an email with the next step.",
    };
  }

  return {
    status: "success",
    message: "Check your inbox for a verification link. You can sign in after confirming your email.",
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readEmail(formData);
  if (!emailPattern.test(email) || email.length > 254) {
    return invalidInput("Enter a valid email address.");
  }

  const supabase = await createClient();
  if (!supabase) {
    return invalidInput("Password recovery is temporarily unavailable. Please try again later.");
  }

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback?next=/auth/reset-password`,
    });
  } catch {
    // Keep the same response for unknown accounts and provider/network failures.
  }

  return {
    status: "success",
    message: "If an account uses that address, you will receive a password reset link.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = readPassword(formData);
  const confirmPassword = readPassword(formData, "confirm_password");

  const passwordBytes = new TextEncoder().encode(password).length;
  if (password.length < passwordMinLength || passwordBytes > passwordMaxLength) {
    return invalidInput(`Use a password between ${passwordMinLength} and ${passwordMaxLength} characters.`);
  }
  if (password !== confirmPassword) {
    return invalidInput("The passwords do not match.");
  }

  const supabase = await createClient();
  if (!supabase) {
    return invalidInput("Password updates are temporarily unavailable. Please try again later.");
  }

  let hasUser = false;
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    hasUser = Boolean(user && !userError);
  } catch {
    return invalidInput("We could not verify the reset link. Request a new one and try again.");
  }
  if (!hasUser) {
    return invalidInput("This reset link is no longer valid. Request a new one and try again.");
  }

  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return invalidInput("We could not update your password. Request a new reset link and try again.");
    }
  } catch {
    return invalidInput("We could not update your password. Request a new reset link and try again.");
  }

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signOutAction() {
  const supabase = await createClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) await supabase.auth.signOut({ scope: "local" });
    } catch {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Navigation still proceeds; the proxy will validate any remaining session.
      }
    }
  }
  revalidatePath("/", "layout");
  redirect("/auth/sign-in");
}
