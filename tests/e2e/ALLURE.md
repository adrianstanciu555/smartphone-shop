# Allure reports

The Playwright suite in `tests/e2e` writes [Allure Report 3](https://allurereport.org/docs/v3/) results for every test: browser UI tests, mocked-API UI tests and REST API tests. Allure 3 runs on Node.js only, so Java is not needed.

The built-in Playwright HTML report (`npm run report`) still works. Allure adds the following:

- a tree grouped by project, spec file and `describe` block
- labels for filtering (layer, epic, feature, severity, tag)
- request/response attachments for every API call
- failure categories
- run history, used for trends and flaky-test detection

## What is set up

| Piece | File | Purpose |
| --- | --- | --- |
| Reporter | [`playwright.config.ts`](playwright.config.ts) | `allure-playwright` writes one JSON file per test to `allure-results/`, plus environment info (base URL, local or CI, Node.js, OS) |
| Report config | [`allurerc.mjs`](allurerc.mjs) | Report name, output folder `allure-report/`, local history in `allure-history/`, failure categories, Awesome UI |
| Labels | [`src/fixtures/index.ts`](src/fixtures/index.ts) (`allureLabels`, automatic) | Sets `layer`, `epic`, `feature` and `severity` on every test |
| API evidence | [`src/api/ApiClient.ts`](src/api/ApiClient.ts) | Every `ApiClient` call is a step named like `POST /api/v1/cart/items`, with a JSON attachment of the request and response |
| Clean start | [`global-setup.ts`](global-setup.ts) | Empties `allure-results/` before each run, so a report only shows the latest run |
| CI | [`.github/workflows/e2e.yml`](../../.github/workflows/e2e.yml) | Generates the report after the tests (even when they fail) and uploads the `allure-report` artifact |

`allure-results/`, `allure-report/`, `allure-history/` and `known-issues.json` are gitignored.

## Running

All commands run in `tests/e2e`. Like `npm test`, they build the app, start it on port 3100 and **reset the database**.

| Command | What it does |
| --- | --- |
| `npm run allure` | Runs all tests through `allure run`, then generates `allure-report/` |
| `npm run allure -- --project=api` | Same, API tests only. Arguments after `--` go to Playwright, e.g. `tests/mocks` or `--grep @smoke` |
| `npm test`, then `npm run allure:generate` | Run the tests your usual way, then build the report from `allure-results/` (`--clean` replaces the previous report) |
| `npm run allure:open` | Serves `allure-report/` and opens it in the browser |
| `npm run allure:watch` | Live report that refreshes while tests write results. Run it in a second terminal next to `npm test` |

Typical local loop:

```bash
cd tests/e2e
npm run allure          # run tests + build the report
npm run allure:open     # view it
```

Environment variables from the [README](README.md#environment-variables) work as usual, for example `E2E_BASE_URL` to test an already running app.

> Open the report with `npm run allure:open` (a local web server). Opening `allure-report/index.html` directly from disk may not load its data in some browsers.

`npm run allure` starts Playwright as `node node_modules/@playwright/test/cli.js test` instead of `npx playwright test`. On Windows, `allure run` launches `npx` through PowerShell (`npx.ps1`), which hung without starting the tests.

Verified on 2026-11-26 (Windows, Node.js 24, Allure 3.33.0, allure-playwright 3.15.0):

- `npm run allure`: 122 passed in 2.1 min, 122 results, report generated.
- `npm run allure -- --project=api`: all API tests passed, history grew to 2 runs.
- GitHub Actions ([run 45891413207](https://github.com/adrianstanciu555/smartphone-shop/actions/runs/45891413207), Ubuntu): 122 passed, *Generate Allure report* and *Upload Allure report* succeeded, `allure-report` artifact about 3 MB.

## Reading the report

### Navigation

- **Tree:** grouped by Playwright project (`api`, `chromium`), then spec file, then `describe` block.
- **Search and filters:** filter by status, or by label, for example `layer`, `feature`, `severity` or tag `smoke`.
- **Charts and timeline:** in the report menu. The timeline shows how the parallel workers spread the tests.

### Labels

| Label | Values | Source |
| --- | --- | --- |
| `layer` | `api`, `ui`, `ui-mocked-api` | First folder under `tests/`: `api/`, `mocks/`, or the root specs |
| `epic` | `REST API`, `UI`, `UI with mocked API` | Same as `layer` |
| `feature` | The top-level `describe` title, e.g. `Cart API`, `Checkout` | `testInfo.titlePath` |
| `severity` | `critical` for `@smoke` tests, otherwise `normal` | Test tags |
| `tag` | `smoke` | Playwright tags from the test title |
| `parentSuite` / `suite` / `subSuite` | Project / spec file / `describe` | `allure-playwright` |

### Test details

- **UI tests:** Playwright actions and `expect` calls appear as steps. On failure you also get the screenshot, video and trace (from `playwright.config.ts`).
- **API tests:** each request is a step, e.g. `GET /api/v1/products`. Inside it, a nested step and attachment named `GET /api/v1/products -> 200` hold the exchange:

  ```json
  {
    "request": { "method": "POST", "url": "http://localhost:3100/api/v1/auth/login", "body": { "email": "e2e.w0.1a2b3c4d@example.com", "password": "***" } },
    "response": { "status": 200, "body": { "user": { "id": "…", "email": "…", "name": "…" } } }
  }
  ```

  `password`, `cardNumber` and `cvc` are replaced with `***`. Request headers such as `Idempotency-Key` are included. Requests made in fixtures, such as `customerApi` logging in, appear under the fixture in **Before Hooks**. Status checks appear as short steps like `HTTP status of /api/v1/products`. The response body is added to the message only when the status is wrong.
- **Mocked-API UI tests:** they show the same browser steps as UI tests. The mocked responses come from `ProductsApiMock`, not the server.

### Categories

Failed and broken tests are grouped in this order. The first matching category wins.

| Category | Matches |
| --- | --- |
| Flaky tests | Marked flaky by Allure (needs history), whatever their status |
| Timeouts | Error message contains `Timeout` / `timed out` |
| API failures | `layer = api`, grouped by feature |
| Mocked API UI failures | `layer = ui-mocked-api` |
| UI failures | `layer = ui`, grouped by feature |

Anything else falls into Allure's default **Product errors** (assertion failures) or **Test errors** (broken tests).

### History, trends and flaky tests

Every report generation (`npm run allure` or `npm run allure:generate`) appends the run to `allure-history/history.jsonl`, keeping the last 20. Trend charts, status changes such as `new`, `fixed` and `regressed`, and flaky detection appear from the second run on. Regenerating the same results adds another entry, so prefer one generation per test run. Delete `allure-history/` to start over. CI keeps no history between runs.

## CI

The `E2E` workflow runs `npx allure generate` after the tests, even when tests fail, and uploads the **allure-report** artifact for 14 days. To view it:

1. Download and unzip the artifact.
2. Run `npx allure open <unzipped folder>` from `tests/e2e`.

The Playwright HTML report and the failure traces are still uploaded as separate artifacts.

## Extending

- **New spec folders:** add the folder to `ALLURE_LAYERS` in `src/fixtures/index.ts`. Otherwise the tests are labelled `ui`.
- **More labels in a test:** import from `allure-js-commons`, for example `await allure.story("Declined card")`, `await allure.issue("SHOP-42")` or `await allure.description("...")`.
- **New API calls:** add them to `ApiClient` through its private `send()`, so they get the step and the attachment.
- **Different categories or report options:** edit `allurerc.mjs`. See [Configure Allure Report 3](https://allurereport.org/docs/v3/configure/).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Report is empty | Don't pass `--reporter=...` on the command line: it replaces the configured reporters, including Allure. Use `npm run allure -- <playwright args>` |
| Old tests appear in the report | `allure-results/` is emptied by global setup. If you copied results in by hand, delete the folder and rerun |
| `allure: command not found` | Run `npm ci` in `tests/e2e`. The CLI is the local `allure` dev dependency, used through the npm scripts or `npx allure` |
| Report page stays blank | Open it with `npm run allure:open`, not straight from disk |
| `npx allure run -- npx playwright test` never starts on Windows | Use `npm run allure`, which runs Playwright through `node` (see [Running](#running)) |
| "The output directory ... is not empty" warning | Use `npm run allure:generate`, which passes `--clean` |
