import { requireApiUser } from "@/lib/api";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  return Response.json(auth.user);
}
