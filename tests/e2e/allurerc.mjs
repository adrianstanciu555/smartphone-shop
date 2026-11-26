import { defineConfig } from "allure";

export default defineConfig({
  name: "Smartphone Shop E2E",
  output: "./allure-report",
  resultsDir: "./allure-results",
  // Local trend and flaky detection across runs; gitignored. CI starts without history.
  historyPath: "./allure-history/history.jsonl",
  historyLimit: 20,
  // First matching rule wins, so flaky failures are grouped before the per-layer categories.
  categories: [
    { name: "Flaky tests", matchers: { flaky: true }, groupBy: ["layer"] },
    { name: "Timeouts", matchers: { statuses: ["failed", "broken"], message: /Timeout|timed out/i }, groupBy: ["layer"] },
    { name: "API failures", matchers: { statuses: ["failed", "broken"], labels: { layer: "api" } }, groupBy: [{ label: "feature" }] },
    { name: "Mocked API UI failures", matchers: { statuses: ["failed", "broken"], labels: { layer: "ui-mocked-api" } } },
    { name: "UI failures", matchers: { statuses: ["failed", "broken"], labels: { layer: "ui" } }, groupBy: [{ label: "feature" }] },
  ],
  plugins: {
    awesome: {
      options: {
        reportLanguage: "en",
      },
    },
  },
});
