import { z } from "zod";
import { apiError, readJson, validationError } from "@/lib/api";
import { createSession } from "@/lib/session";
import { loginOrRegister } from "@/lib/users";

const loginSchema = z.object({
  email: z.string().trim().pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(1, { error: "Password is required." }).max(128, { error: "Password is too long." }),
});

/** Same rules as the login form: an unknown email registers a new customer. Sets the session cookie. */
export async function POST(request: Request) {
  const json = await readJson(request);
  if (!json.ok) return json.response;

  const parsed = loginSchema.safeParse(json.body);
  if (!parsed.success) return validationError(parsed.error);

  const result = await loginOrRegister(parsed.data.email, parsed.data.password);
  if (!result.ok) return apiError(401, "invalid_credentials", result.error);

  await createSession(result.user);
  return Response.json({ user: result.user });
}
