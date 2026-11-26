import { resetDatabase } from "@/lib/reset-database";

// Test-only endpoint: enabled only when ENABLE_TEST_RESET=true in .env.local.
export async function POST() {
  if (process.env.ENABLE_TEST_RESET !== "true" || !process.env.DATABASE_URL) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const { products } = await resetDatabase(process.env.DATABASE_URL);
  return Response.json({ status: "reset", products });
}
