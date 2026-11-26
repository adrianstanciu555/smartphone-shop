# Smartphone Shop E2E Tests

Playwright + TypeScript end-to-end tests for the Next.js app in [`frontend/`](../../frontend): 122 tests in two projects.

| Project | Tests | What |
| --- | --- | --- |
| `chromium` | 56 | 44 UI tests through page objects and 12 UI tests against a mocked API (`tests/*.spec.ts`, `tests/mocks/`) |
| `api` | 66 | Browserless REST API tests for `/api/v1` (`tests/api/`) |

8 tests are tagged `@smoke` (4 UI, 4 API). Visual overviews: [framework mindmap](framework-mindmap.md) and [API tests mindmap](tests/api/api-tests-mindmap.md).

## Prerequisites

- Node.js 24+
- PostgreSQL running and seeded, with the app configured in `frontend/.env.local`. Set `DATABASE_URL`, `SESSION_SECRET` and `ENABLE_TEST_RESET=true`.
- Frontend dependencies installed (`cd frontend && npm ci`)

## Setup

```bash
cd tests/e2e
npm ci
npx playwright install chromium
```

## Running

| Command | Description |
| --- | --- |
| `npm test` | Run all tests (headless, 4 workers locally) |
| `npm run test:smoke` | Run only tests tagged `@smoke` (UI and API) |
| `npm run test:api` | Run only the REST API tests (`api` project, no browser) |
| `npm run test:mocks` | Run only the UI tests that mock the API with `page.route()` |
| `npm run test:headed` | Run with a visible browser |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run report` | Open the last HTML report |
| `npm run allure` | Run all tests and build an Allure report (see [ALLURE.md](ALLURE.md)); Playwright arguments go after `--`, e.g. `npm run allure -- --project=api` |
| `npm run allure:generate` | Build the Allure report from the results of the last `npm test` |
| `npm run allure:open` | Open the last Allure report |
| `npm run allure:watch` | Live Allure report while tests run |
| `npm run typecheck` | Type-check the framework |

By default Playwright runs `npm run build && npm run start -- --port 3100` in `frontend/` and tests against `http://localhost:3100`. It uses a production build because `next dev` compiles on demand and is too slow under parallel workers. Next 16 keeps dev output in `.next/dev`, so this can run while `npm run dev` is running on port 3000. Locally, an already running server on the port is reused.

Before the run, global setup empties `allure-results/` and calls `POST /api/test/reset`, which **wipes and reseeds the database**.

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `E2E_BASE_URL` | — | Test an already running app instead of starting one (e.g. `http://localhost:3000`) |
| `E2E_PORT` | `3100` | Port for the server started by Playwright |
| `E2E_SKIP_RESET` | — | Set to `true` to skip the database reset |
| `DATABASE_URL` | from `frontend/.env.local` | Database used by the DB helper for assertions |
| `CI` | — | Enables 2 retries, 2 workers, `forbidOnly`, and never reuses a server |

Don't pass `--reporter=...` on the command line: it replaces all configured reporters, including Allure.

## Structure

```text
tests/e2e/
├── playwright.config.ts   # Workers, timeouts, reporters (list, HTML, Allure), webServer
├── allurerc.mjs           # Allure 3 report config: output, history, categories
├── ALLURE.md              # How to run, read and extend the Allure reports
├── framework-mindmap.md   # Mermaid mindmap of the whole framework and all specs
├── global-setup.ts        # Clears allure-results, DB reset + route warm-up
├── src/
│   ├── api/ApiClient.ts   # REST client for /api/v1 + expectStatus / expectError
│   ├── api/contracts.ts   # Response contracts as asymmetric matchers (use with toEqual)
│   ├── data/test-data.ts  # Cards, delivery fees, seeded products, customer/address factories
│   ├── fixtures/index.ts  # Extended `test`: page objects, db, customer, signedInCustomer, addToCart, api, customerApi, newCustomerApi, allureLabels (automatic)
│   ├── helpers/db.ts      # Read-only Postgres queries for backend assertions (stock, orders, carts)
│   ├── mocks/             # page.route() helpers and fake data (ProductsApiMock)
│   ├── pages/             # Page objects (Login, Catalog, Product, Cart, Checkout, Order, Header)
│   └── utils/money.ts     # EUR formatting and VAT helpers
└── tests/                 # Specs: auth, catalog, cart, checkout, access-control
    ├── api/               # REST API specs (products, auth, cart, checkout) - `api` project; mindmap in api-tests-mindmap.md
    └── mocks/             # UI specs against a mocked API (search suggestions)
```

## API tests

The app exposes a small JSON API under `/api/v1` (see `frontend/app/api/v1`). It reuses the same business logic as the server actions and a subset of the paths in [`docs/openapi.yaml`](../../docs/openapi.yaml). Auth uses the same `session` cookie as the UI, sent by `POST /api/v1/auth/login`.

| Endpoint | Notes |
| --- | --- |
| `POST /auth/login`, `POST /auth/logout`, `GET /users/me` | Unknown emails register, like the login form |
| `GET /products?q&category&page&pageSize`, `GET /products/{id}`, `GET /categories` | Public |
| `GET` / `DELETE /cart`, `POST /cart/items`, `PATCH` / `DELETE /cart/items/{productId}` | Max 10 units per item; `PATCH` / `DELETE` of a product that is not in the cart return 404 `not_in_cart` |
| `POST /checkout` | `Idempotency-Key` header (UUID) required; flat body with address, `deliveryMethod` and card fields; 402 when the card is declined |
| `GET /orders/{id}` | 404 for other customers' orders |

Errors use `{ code, message, details? }`. Bodies must be `application/json` (415 otherwise).

| Status | `code` |
| --- | --- |
| 400 | `invalid_json`, `idempotency_key_required` |
| 401 | `unauthorized`, `invalid_credentials` |
| 402 | `payment_declined` (body also has `orderId`) |
| 404 | `not_found`, `not_in_cart` |
| 409 | `out_of_stock`, `insufficient_stock`, `cart_empty` |
| 415 | `unsupported_media_type` |
| 422 | `validation_error` (with `details[].field`), `quantity_limit` |

- `api` gives an anonymous client and `customerApi` logs that same client in as a fresh customer, so don't use both in one test expecting different sessions. `newCustomerApi()` creates extra customers with their own cookie jars.
- Assert contracts with `expect(body).toEqual(productContract())`. `toEqual` also fails on unexpected fields.
- To set up UI state quickly, wrap `page.request` in `ApiClient`. It shares the browser's cookies (see the last test in `cart.spec.ts`).
- Stock-changing API tests use `API_PRODUCTS`. No other spec changes their stock.
- Add new endpoints to `ApiClient` through its private `send()`: each call then becomes a report step with a request/response attachment (passwords and card data redacted).

## API mocks

The catalog search box fetches live suggestions from `GET /api/v1/products` in the browser. `ProductsApiMock` intercepts that call with `page.route()`. It can return fixed data (`respondWith`), HTTP errors (`failWith`), a network failure (`abort`), a held response for loading states (`held`), or a modified real response (`patchRealResponse`). It also records each request URL in `mock.requests`.

Only browser requests can be mocked. Server-rendered pages and server actions talk to the database directly, so they always use real data.

## Conventions

- Import `test` and `expect` from `src/fixtures`, not from `@playwright/test`.
- Locate elements by `data-testid`, role or label inside page objects. Specs should not contain raw selectors.
- Tests run fully in parallel against one shared database:
  - Every test gets a unique customer (`customer` / `signedInCustomer` fixtures), so carts and orders never collide.
  - Tests that change stock must use a product that no other test changes, so stock assertions stay exact.
- Prefer `BasePage.submitServerAction` or a visible UI result over fixed waits after submitting forms.
- Tag critical-path tests with `@smoke`.
- Keep test titles stable (no random values): Playwright matches tests across workers by title.
- Allure labels (layer, epic, feature, severity) are set automatically from the spec folder, the top-level `describe` and the `@smoke` tag. New spec folders need an entry in `ALLURE_LAYERS` in `src/fixtures/index.ts`.
