"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, safeReturnPath } from "@/lib/session";
import { loginOrRegister } from "@/lib/users";

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  email?: string;
};

const loginSchema = z.object({
  email: z.string().trim().min(1, { error: "Email is required." }).pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(1, { error: "Password is required." }).max(128, { error: "Password is too long." }),
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") ?? "" });

  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return { email, fieldErrors: { email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] } };
  }

  const result = await loginOrRegister(parsed.data.email, parsed.data.password);
  if (!result.ok) return { email, error: result.error };

  await createSession(result.user);
  redirect(safeReturnPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
