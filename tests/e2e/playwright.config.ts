import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const frontendDir = path.resolve(__dirname, "../../frontend");
const frontendEnv = path.join(frontendDir, ".env.local");

// Reuse the app's DATABASE_URL so the DB helper talks to the same database as the app under test.
if (!process.env.DATABASE_URL && existsSync(frontendEnv)) process.loadEnvFile(frontendEnv);

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  /*
   * Runs against a production build: `next dev` compiles on demand and is too slow for parallel workers.
   * Next 16 builds into .next/ and dev into .next/dev, so this can run next to `npm run dev` on :3000.
   * Set E2E_BASE_URL to test an already running instance instead (e.g. http://localhost:3000).
   */
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build && npm run start -- --port ${port}`,
        cwd: frontendDir,
        // /login needs no database, so the server is ready before globalSetup creates and seeds it (fresh CI database).
        url: `${baseURL}/login`,
        reuseExistingServer: !isCI,
        timeout: 180_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
