import { hash, verify } from "@node-rs/argon2";
import { pool } from "./db";
import type { SessionUser } from "./session";

export type LoginResult = { ok: true; user: SessionUser } | { ok: false; error: string };

/** Any email/password logs in: unknown emails create an account, known emails must match their password. */
export async function loginOrRegister(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await pool.query<{ id: string; email: string; name: string; password_hash: string; status: string }>(
    "SELECT id, email, name, password_hash, status FROM users WHERE email = $1",
    [normalizedEmail],
  );

  let row = existing.rows[0];
  if (!row) {
    const name = normalizedEmail.split("@")[0].slice(0, 100);
    const passwordHash = await hash(password);
    const inserted = await pool.query<{ id: string; email: string; name: string }>(
      `INSERT INTO users (email, password_hash, name, role, status, email_verified_at, last_login_at)
       VALUES ($1, $2, $3, 'customer', 'active', now(), now())
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name`,
      [normalizedEmail, passwordHash, name],
    );
    if (inserted.rows[0]) return { ok: true, user: inserted.rows[0] };
    // Another request created the account concurrently; fall through to a normal password check.
    row = (await pool.query("SELECT id, email, name, password_hash, status FROM users WHERE email = $1", [normalizedEmail])).rows[0];
  }

  if (!(await verify(row.password_hash, password))) {
    return { ok: false, error: "Invalid email or password." };
  }
  if (row.status !== "active") {
    return { ok: false, error: `This account is ${row.status}.` };
  }

  await pool.query("UPDATE users SET last_login_at = now() WHERE id = $1", [row.id]);
  return { ok: true, user: { id: row.id, email: row.email, name: row.name } };
}
