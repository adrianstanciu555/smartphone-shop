"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingText: string;
  testId: string;
  disabled?: boolean;
  className?: string;
};

// Disabled while pending so double-clicks cannot submit twice.
export function SubmitButton({ children, pendingText, testId, disabled, className }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      data-testid={testId}
      className={
        className ??
        "rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      }
    >
      {pending ? pendingText : children}
    </button>
  );
}
