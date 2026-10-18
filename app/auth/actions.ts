"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import {
  techtronicaAuthMessage,
  techtronicaErrorMessage,
} from "@/lib/techtronica/messages";

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
    return invalidInput(techtronicaAuthMessage.signInInput);
  }

  const supabase = await createClient();
  if (!supabase) {
    return invalidInput(techtronicaErrorMessage.signInUnavailable);
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return invalidInput(techtronicaErrorMessage.signInInvalid);
    }
  } catch {
    return invalidInput(techtronicaErrorMessage.signInUnavailable);
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
    return invalidInput(techtronicaAuthMessage.signUpName);
  }
  if (!emailPattern.test(email) || email.length > 254) {
    return invalidInput(techtronicaAuthMessage.emailInvalid);
  }
  const passwordBytes = new TextEncoder().encode(password).length;
  if (password.length < passwordMinLength || passwordBytes > passwordMaxLength) {
    return invalidInput(techtronicaErrorMessage.passwordLength(passwordMinLength, passwordMaxLength));
  }
  if (password !== confirmPassword) {
    return invalidInput(techtronicaErrorMessage.passwordMismatch);
  }

  const supabase = await createClient();
  if (!supabase) {
    return invalidInput(techtronicaErrorMessage.signUpUnavailable);
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
      message: techtronicaAuthMessage.registrationPrivate,
    };
  }

  return {
    status: "success",
    message: techtronicaAuthMessage.verificationSent,
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readEmail(formData);
  if (!emailPattern.test(email) || email.length > 254) {
    return invalidInput(techtronicaAuthMessage.emailInvalid);
  }

  const supabase = await createClient();
  if (!supabase) {
    return invalidInput(techtronicaErrorMessage.recoveryUnavailable);
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
    message: techtronicaAuthMessage.resetSent,
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
    return invalidInput(techtronicaErrorMessage.passwordLength(passwordMinLength, passwordMaxLength));
  }
  if (password !== confirmPassword) {
    return invalidInput(techtronicaErrorMessage.passwordMismatch);
  }

  const supabase = await createClient();
  if (!supabase) {
    return invalidInput(techtronicaErrorMessage.passwordUpdateUnavailable);
  }

  let hasUser = false;
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    hasUser = Boolean(user && !userError);
  } catch {
    return invalidInput(techtronicaErrorMessage.resetLinkUnverified);
  }
  if (!hasUser) {
    return invalidInput(techtronicaErrorMessage.resetLinkInvalid);
  }

  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return invalidInput(techtronicaErrorMessage.passwordUpdateFailed);
    }
  } catch {
    return invalidInput(techtronicaErrorMessage.passwordUpdateFailed);
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
