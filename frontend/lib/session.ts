import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { pool } from "./db";

const COOKIE_NAME = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type SessionUser = { id: string; email: string; name: string };

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters in .env.local");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] }));
  } catch {
    return null;
  }
  if (!payload.sub) return null;

  // The account may have been deleted (database reset) or locked since the cookie was issued.
  const { rows } = await pool.query<{ email: string; name: string }>(
    "SELECT email, name FROM users WHERE id = $1 AND status = 'active'",
    [payload.sub],
  );
  return rows[0] ? { id: payload.sub, email: rows[0].email, name: rows[0].name } : null;
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

/** Redirects to /login (and back to `returnTo` afterwards) when there is no valid session. */
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Only allow same-site relative paths to prevent open redirects. */
export function safeReturnPath(value: unknown, fallback = "/catalog"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
