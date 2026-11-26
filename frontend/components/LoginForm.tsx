"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { SubmitButton } from "./SubmitButton";

const inputClass = "w-full rounded border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} noValidate className="space-y-4" data-testid="login-form">
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700" data-testid="login-error">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          className={inputClass}
          data-testid="login-email"
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600" data-testid="login-email-error">{state.fieldErrors.email}</p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          className={inputClass}
          data-testid="login-password"
        />
        {state.fieldErrors?.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600" data-testid="login-password-error">{state.fieldErrors.password}</p>
        )}
      </div>
      <SubmitButton pendingText="Logging in..." testId="login-submit" className="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:bg-slate-400">
        Log in
      </SubmitButton>
    </form>
  );
}
