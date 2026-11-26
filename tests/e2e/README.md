# Smartphone Shop E2E Tests

Playwright + TypeScript end-to-end tests for the Next.js app in [`frontend/`](../../frontend).

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
| `npm run test:smoke` | Run only tests tagged `@smoke` |
| `npm run test:headed` | Run with a visible browser |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | Type-check the framework |

By default Playwright runs `npm run build && npm run start -- --port 3100` in `frontend/` and tests against `http://localhost:3100`. It uses a production build because `next dev` compiles on demand and is too slow under parallel workers. Next 16 keeps dev output in `.next/dev`, so this can run while `npm run dev` is running on port 3000. Locally, an already running server on the port is reused.

Before the run, global setup calls `POST /api/test/reset`, which **wipes and reseeds the database**.

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `E2E_BASE_URL` | — | Test an already running app instead of starting one (e.g. `http://localhost:3000`) |
| `E2E_PORT` | `3100` | Port for the server started by Playwright |
| `E2E_SKIP_RESET` | — | Set to `true` to skip the database reset |
| `DATABASE_URL` | from `frontend/.env.local` | Database used by the DB helper for assertions |
| `CI` | — | Enables 2 retries, 2 workers, `forbidOnly`, and never reuses a server |

## Structure

```text
tests/e2e/
├── playwright.config.ts   # Workers, timeouts, reporters, webServer
├── global-setup.ts        # DB reset + route warm-up
├── src/
│   ├── data/test-data.ts  # Cards, delivery fees, seeded products, customer/address factories
│   ├── fixtures/index.ts  # Extended `test`: page objects, db, customer, signedInCustomer, addToCart
│   ├── helpers/db.ts      # Read-only Postgres queries for backend assertions (stock, orders, carts)
│   ├── pages/             # Page objects (Login, Catalog, Product, Cart, Checkout, Order, Header)
│   └── utils/money.ts     # EUR formatting and VAT helpers
└── tests/                 # Specs: auth, catalog, cart, checkout, access-control
```

## Conventions

- Import `test` and `expect` from `src/fixtures`, not from `@playwright/test`.
- Locate elements by `data-testid`, role or label inside page objects. Specs should not contain raw selectors.
- Tests run fully in parallel against one shared database:
  - Every test gets a unique customer (`customer` / `signedInCustomer` fixtures), so carts and orders never collide.
  - Tests that change stock must use a product that no other test changes, so stock assertions stay exact.
- Prefer `BasePage.submitServerAction` or a visible UI result over fixed waits after submitting forms.
- Tag critical-path tests with `@smoke`.
