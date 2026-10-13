"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  children: ReactNode;
  pendingLabel?: string;
};

export default function PendingSubmitButton({
  children,
  className,
  disabled,
  pendingLabel = "Saving…",
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      aria-busy={pending || undefined}
      className={className}
      disabled={disabled || pending}
      type="submit"
    >
      {pending && (
        <span
          aria-hidden="true"
          className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-3px]"
        />
      )}
      {children}
      <span aria-live="polite" className="sr-only">{pending ? pendingLabel : ""}</span>
    </button>
  );
}
