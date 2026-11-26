import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getSessionUser, safeReturnPath } from "@/lib/session";

export const metadata: Metadata = { title: "Log in | Smartphone Shop" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const returnTo = safeReturnPath(next);

  if (await getSessionUser()) redirect(returnTo);

  return (
    <section className="mx-auto max-w-sm rounded border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Log in</h1>
      <p className="mb-6 text-sm text-slate-500">
        Use any email and password. A new account is created on first login.
      </p>
      <LoginForm next={returnTo} />
    </section>
  );
}
