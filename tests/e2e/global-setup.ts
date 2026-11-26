import { request, type FullConfig } from "@playwright/test";

// First requests to each route are slow on a dev server; harmless on a production build.
const WARM_UP_PATHS = ["/catalog", "/login", "/cart", "/checkout", "/product/00000000-0000-0000-0000-000000000000"];

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL;
  const api = await request.newContext({ baseURL });
  try {
    if (process.env.E2E_SKIP_RESET !== "true") {
      const response = await api.post("/api/test/reset", { timeout: 60_000 });
      if (!response.ok()) {
        throw new Error(
          `POST /api/test/reset failed with ${response.status()}. Set ENABLE_TEST_RESET=true in frontend/.env.local ` +
            "and restart the app, or set E2E_SKIP_RESET=true to run against the current data.",
        );
      }
    }
    for (const warmUpPath of WARM_UP_PATHS) {
      await api.get(warmUpPath, { timeout: 60_000, maxRedirects: 0 });
    }
  } finally {
    await api.dispose();
  }
}
