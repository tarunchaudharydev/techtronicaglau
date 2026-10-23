"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

type SignOutButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type"> & {
  children?: ReactNode;
  containerClassName?: string;
  pendingLabel?: string;
};

export default function SignOutButton({
  children = <><LogOut aria-hidden="true" className="size-4" />Sign out</>,
  className = "",
  containerClassName,
  pendingLabel = "Signing out…",
  disabled,
  ...props
}: SignOutButtonProps) {
  const { signOut } = useClerk();
  const { sessionId } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    if (isSigningOut || disabled) return;

    setIsSigningOut(true);
    setError(null);

    try {
      await signOut({
        sessionId: sessionId ?? undefined,
        redirectUrl: "/auth/sign-in?signed_out=1",
      });
    } catch {
      setIsSigningOut(false);
      setError("We couldn’t sign you out. Check your connection and try again.");
    }
  }

  return (
    <div className={containerClassName}>
      <button
        {...props}
        aria-busy={isSigningOut || undefined}
        disabled={disabled || isSigningOut}
        onClick={handleSignOut}
        type="button"
        className={className}
      >
        {isSigningOut && (
          <span
            aria-hidden="true"
            className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-3px]"
          />
        )}
        {isSigningOut ? pendingLabel : children}
      </button>
      {error && <p className="mt-1 text-xs text-rose-700" role="alert">{error}</p>}
      <span aria-live="polite" className="sr-only" role="status">
        {isSigningOut ? "Signing out of your account" : ""}
      </span>
    </div>
  );
}
