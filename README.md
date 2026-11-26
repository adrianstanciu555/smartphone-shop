# Smartphone Shop

Online store for buying smartphones and compatible accessories (cases, chargers, cables, earbuds, screen protectors).

> **Status:** In progress. The target architecture is documented in [docs/context.md](docs/context.md). A local reference app ([frontend/](frontend/README.md)) implements the core customer journey (catalog, login, cart, checkout) plus a small JSON API under `/api/v1`. It is covered by a Playwright suite of UI, API and mocked-API tests ([tests/e2e/](tests/e2e/README.md)).

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Testing Strategy](#testing-strategy)
- [Business Rules](#business-rules)
- [Documentation](#documentation)
- [Implementation Status](#implementation-status)
- [Roadmap](#roadmap)

## Overview

Smartphone Shop is a B2C, web-first e-commerce platform for consumer electronics.

User flow:

1. A visitor browses the catalog (no account required) and signs up.
2. The customer adds products to the cart and pays at checkout.
3. The order is delivered to the customer's address and can be tracked or returned.

Launch targets: 1,000 orders, and a minimum stock of 2,000 smartphones and 5,000 accessories.

## Features

| Module | Description |
| --- | --- |
| User Accounts & Authentication | Sign up, email verification, login, password reset, profile and addresses |
| Product Catalog | Listing, product details, search, filtering, and sorting |
| Shopping Cart | Add, remove, and update quantities, totals, stock check |
| Checkout & Payments | Delivery selection, online card payment, order confirmation |
| Order Management & Delivery | Order history, status tracking, courier shipment, cancellation, returns |
| Inventory Management | Stock levels, reservation at checkout, low-stock alerts |
| Admin Back Office | Products, prices, stock, orders, refunds, users |

## User Roles

- **Visitor:** browses the catalog without an account.
- **Customer:** registered user who can buy (no guest checkout).
- **Catalog/Inventory Manager:** manages products, prices, and stock.
- **Support/Fulfillment Agent:** handles orders, returns, and refunds.
- **Admin:** full back office access, user and role management.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | TypeScript, Next.js (React), Tailwind CSS |
| Backend | TypeScript, Node.js, NestJS (modular monolith, REST/OpenAPI) |
| Data | PostgreSQL, Redis, OpenSearch |
| Integrations | Stripe (payments), courier API, email/SMS provider |
| Infrastructure | Docker, AWS, Terraform, GitHub Actions |
| Monitoring | OpenTelemetry, Grafana/Prometheus, Sentry |
| Testing | Playwright (TypeScript), Postman/Newman, Jest, k6, OWASP ZAP, Allure |

The local reference app uses only part of this stack: Next.js with server actions talking to PostgreSQL directly, a small cookie-authenticated JSON API under `/api/v1`, a signed session cookie, and a simulated card payment. See [frontend/README.md](frontend/README.md) for details.

## Quick Start

Requires Node.js 24+ and PostgreSQL 17.

```bash
cd frontend
cp .env.example .env.local   # then set DATABASE_URL and SESSION_SECRET
npm ci
npm run db:reset             # schema + 100 seeded products
npm run dev                  # http://localhost:3000

cd ../tests/e2e
npm ci
npx playwright install chromium
npm test                     # builds the app, serves it on :3100, resets the DB, runs the suite
npm run allure               # same, then builds an Allure report; view it with npm run allure:open
```

## Project Structure

Current layout. The [project mindmap](docs/mindmap.md) shows both the current project and the full target architecture, including `backend/` and `infrastructure/`.

```text
smartphone-shop/
├── docs/                    # Context, OpenAPI contract, mindmap, test design (user stories, test cases, bugs), test data
├── frontend/                # Next.js reference app (catalog, login, cart, checkout, JSON API under /api/v1)
├── database/                # PostgreSQL schema and seeds
├── tests/e2e/               # Playwright + TypeScript suite: UI, REST API and mocked-API tests, Allure reports
├── .github/workflows/       # CI (E2E on push and pull request)
├── accessibility-testing/   # WCAG report from an exploratory Playwright MCP run (GlobalSQA demo site)
├── demoblaze/               # Checkout-flow report from a Playwright MCP run (demoblaze.com)
├── saucedemo/               # Login scenario screenshots from a Playwright MCP run
├── playwright-output/       # Page snapshots and console logs from Playwright MCP sessions
├── figma-output/            # Mock design exported with the Figma MCP server
└── .vscode/                 # MCP server configuration (Playwright MCP, Figma MCP)
```

Planned, not yet created: `backend/` (NestJS API) and `infrastructure/` (Docker, Terraform).

## Testing Strategy

Target approach:

- **Unit:** Jest
- **API:** Postman collections run with Newman
- **UI/E2E:** Playwright with TypeScript (see [tests/e2e](tests/e2e/README.md))
- **Performance:** k6 load, stress, spike, and soak tests
- **Security:** OWASP Top 10 checks, dependency and container scans, OWASP ZAP
- **Reporting:** Allure

Implemented so far: one Playwright + TypeScript suite in [tests/e2e](tests/e2e/README.md) with two projects:

- **`chromium`:** UI tests through page objects, plus UI tests that mock the browser's API calls with `page.route()`.
- **`api`:** browserless REST API tests for `/api/v1`.

Both projects check results in the database as well. Results are reported as the Playwright HTML report and as an **Allure Report 3** report with labels, API request/response attachments, failure categories and local history (see [tests/e2e/ALLURE.md](tests/e2e/ALLURE.md)). Postman/Newman, Jest, k6 and ZAP are not set up yet.

### Test mindmaps

Three Mermaid mindmaps give a visual overview, from the whole project down to single tests. They render on GitHub and in the VS Code Markdown preview with white text on colored branches.

- [Project mindmap](docs/mindmap.md): a summary of the project with links to all docs, and four diagrams.
  - **Current project:** reference app, database, E2E suite, CI, test design docs, MCP exploratory runs.
  - **Target architecture:** the planned frontend, NestJS backend, data stores, integrations, infrastructure and testing.
  - **Main flow:** the customer journey, marking implemented and planned steps.
  - **External services:** the planned Stripe, courier and email/SMS integrations.

- [Framework mindmap](tests/e2e/framework-mindmap.md): the whole Playwright framework.
  - **Setup and run:** config, projects, web server, global database reset, environment variables, scripts, CI.
  - **Framework layers:** page objects, fixtures, test data, DB helper, API client, mocks, utils.
  - **Conventions:** the rules that keep parallel tests isolated.
  - **Specs:** every UI, mocked-API and API spec, with test counts.
- [API tests mindmap](tests/e2e/tests/api/api-tests-mindmap.md): a detailed view of the 66 REST API tests (products, auth, cart, checkout and orders) and the 12 mocked-API UI tests. Each branch lists the scenarios covered, such as paging and validation (422), auth and session errors (401, 415, 400), cart limits and stock, idempotent checkout, declined payments, delivery fees and order isolation.

## Business Rules

- Browsing is open; adding to cart and buying require a registered account.
- Stock is reserved at checkout and released if payment fails. (The reference app has no reservation yet: it locks stock rows and deducts stock only when the payment succeeds.)
- Returns are accepted within 30 days of delivery.
- Card data is handled only by the payment provider (PCI DSS).
- GDPR applies to customer data.

## Documentation

- [Project context](docs/context.md): overview, requirements, testing approach, and constraints
- [Frontend reference app](frontend/README.md): setup, routes, test cards, and business rules as implemented
- [E2E tests](tests/e2e/README.md): Playwright framework, commands, conventions, API tests and API mocks
- [Allure reports](tests/e2e/ALLURE.md): how to run, read and extend the Allure reports locally and in CI
- [Framework mindmap](tests/e2e/framework-mindmap.md) and [API tests mindmap](tests/e2e/tests/api/api-tests-mindmap.md): visual overviews of the test suite
- [OpenAPI contract](docs/openapi.yaml): target REST API for the NestJS backend (a subset is served by the reference app under `/api/v1`)
- [Project mindmap](docs/mindmap.md): summary, current project and target architecture, customer flow, external services, with links to all docs
- [Prompt examples](docs/prompt-examples.md)

## Implementation Status

What the implementation commits delivered (first three verified on 2026-11-26 from a clean checkout of `23dce6c`; commits up to `68025c6` verified by the GitHub Actions run on `68025c6`, `45c7c54` is documentation only; `acbdd99` verified by [run 45893176165](https://github.com/adrianstanciu555/smartphone-shop/actions/runs/45893176165) on `main`):

| Commit | Scope | Contents |
| --- | --- | --- |
| `56c200a` | Reference app | Next.js 16 app in `frontend/`: catalog with search and category filter, product page, login (auto-registers new emails), cart (max 10 units per product, stock checks), checkout (address, standard/express delivery, simulated card payment), order confirmation, test-only `POST /api/test/reset`. Fixes the delivery method resetting to Standard after a failed checkout submit; adds product and order page titles. |
| `47b4b93` | E2E suite and CI | Playwright + TypeScript framework in `tests/e2e/` (page objects, fixtures, PostgreSQL helper, test data) with 41 tests. GitHub Actions workflow `.github/workflows/e2e.yml` with a Postgres 17 service. |
| `23dce6c` | Documentation | Frontend and E2E READMEs, this README, a "Current Implementation" section in `docs/context.md`, a scope note in `docs/openapi.yaml`. |
| `79b3932` | Documentation | This Implementation Status section and the detailed Roadmap. |
| `f7e68ff` | Product images | One compact image per product (see [Product images](#product-images)), seeded into `product_images`; 2 new E2E tests. |
| `68025c6` | CI fix | Playwright waits for `/login` instead of `/catalog`, so the server is ready before globalSetup creates the schema on CI's empty database. |
| `45c7c54` | Documentation | README update for the image and CI fix commits and the CI results. |
| `acbdd99` | REST API, API tests and mocks | Squash of the `feat/api-tests-allure` branch (deleted after the merge). JSON API under `/api/v1` (auth, products, categories, cart, checkout with `Idempotency-Key`, orders), live search suggestions on the catalog, 66 API tests (`api` project), 12 mocked-API UI tests, 1 API-setup UI test, framework and API test mindmaps, documentation updates. |
| `acbdd99` | Allure reporting | Allure Report 3 for all tests (`allure-playwright`, `allurerc.mjs`): automatic layer/epic/feature/severity labels, request/response attachments for every API call, failure categories, local history, CI artifact. Guide in [tests/e2e/ALLURE.md](tests/e2e/ALLURE.md). |

E2E coverage (122 tests in 10 spec files, 8 tagged `@smoke`: 4 UI and 4 API):

| Spec | Tests | Covers |
| --- | --- | --- |
| `auth.spec.ts` | 8 | First login creates the account, returning login, wrong password, case-insensitive email, field validation, return URL, open-redirect protection, logout |
| `catalog.spec.ts` | 12 | Product list, search, category filter, combined filters, empty state, SQL wildcards, unknown category, product page, product images (catalog and product page), out-of-stock, 404 |
| `cart.spec.ts` | 10 | Login required, add with quantity, merge quantities, 10-unit limit, update totals, browser max validation, remove items, empty-cart checkout redirect, cart filled through the API shown in the UI |
| `checkout.spec.ts` | 9 | Paid order with stock deduction, delivery fees, declined card with retry, express delivery kept after errors, required fields, 4 invalid-card cases |
| `access-control.spec.ts` | 5 | Anonymous redirects (cart, checkout, order), another customer's order returns 404, tampered session cookie |
| `mocks/search-suggestions.spec.ts` | 12 | Search suggestions against a mocked API: rendering, request parameters and debounce, min length, empty, loading, HTTP 500/503/429, network failure, modified real response, link target, HTML injection |
| `api/products.api.spec.ts` | 23 | Paging, category filter, case-insensitive search, SQL wildcards, 422 for invalid query parameters, product details vs database, availability, 404s, categories |
| `api/auth.api.spec.ts` | 14 | Login registers and sets an HttpOnly cookie, `users/me`, wrong password, 422/415/400 bodies, logout, forged cookie, 401 on 6 protected endpoints |
| `api/cart.api.spec.ts` | 17 | Empty cart, totals, merging, 10-unit limit, 5 invalid inputs, out of stock, unknown product, update, not-in-cart checked before stock, remove, clear, isolation between customers |
| `api/checkout.api.spec.ts` | 12 | Paid order with stock deduction, idempotent replay, declined card with retry, 3 delivery-fee cases, empty cart, missing/invalid `Idempotency-Key`, field validation, another customer's order, malformed id |

Verification results:

| Check | Result |
| --- | --- |
| `npm ci`, `npm run lint`, `npx next typegen` + `npx tsc --noEmit` (frontend) | Pass |
| `npm ci`, `npm run typecheck` (tests/e2e) | Pass |
| `npx playwright test` with `CI=true` (production build, 2 workers, starting from an empty database; before the REST API work) | 43 passed in 1.4 min |
| Relative links in the README files | All valid |
| GitHub Actions run on `68025c6` | [Passed](https://github.com/adrianstanciu555/smartphone-shop/actions/runs/45849557296) (lint, typecheck, 43 E2E tests). The run on `f7e68ff` failed with a web server timeout, fixed in `68025c6`. |
| Local `npx playwright test` after the REST API work (production build, 4 workers, 2026-11-26) | 121 passed in 2.0 min; frontend lint and type-check and E2E type-check pass. |
| Local `npm run allure` after the code review (2026-11-26) | 122 passed in 2.1 min; 122 Allure results with labels and API attachments, report and history generated; frontend lint and type-check and E2E type-check pass. |
| GitHub Actions run on `14f027b` (branch `feat/api-tests-allure`, manual dispatch, 2026-11-26; same code as `acbdd99`) | [Passed](https://github.com/adrianstanciu555/smartphone-shop/actions/runs/45891413207): lint, typecheck, 122 tests in 51 s on a fresh database, Allure report generated and uploaded (`allure-report` artifact, 3 MB) next to `playwright-report`. |
| GitHub Actions run on `acbdd99` (push to `main`, 2026-11-26) | [Passed](https://github.com/adrianstanciu555/smartphone-shop/actions/runs/45893176165): lint, typecheck, 122 tests in 42 s, `playwright-report` and `allure-report` artifacts uploaded. |

Known limitations:

- In an early manual test, one add-to-cart with quantity 2 added only 1 unit. It could not be reproduced in more than 10 later attempts or in the automated suite.
- Login (form and `POST /api/v1/auth/login`) has no rate limiting or account lockout yet.
- The catalog search suggestions panel has no close action (Escape or click outside); it hides when the term is shorter than 2 characters.
- `npm audit` in `tests/e2e` reports 6 moderate vulnerabilities in dependencies of the Allure packages (dev-only, not shipped with the app).

### Product images

One small image per product (48 files, about 55 KB in total, 320 px, each under 13 KB), seeded into `product_images` from `docs/product-images.csv` and shown on the catalog cards and product page.

- **Photos:** six phone models (iPhone 15, Pixel 8, Galaxy S24, Xperia 1 V, OPPO Find X7, Vivo X100) use freely licensed Wikimedia Commons photos (CC BY-SA 4.0 / CC0), converted to WebP.
- **Drawings:** HONOR Magic6, Motorola Edge 40, OnePlus Nord 3, Redmi Note 13 and all accessories use SVG drawings, because no suitable free photo exists.
- **Generator:** `npm run images:build` in `frontend/`.
- **Credits:** [frontend/public/products/ATTRIBUTION.md](frontend/public/products/ATTRIBUTION.md).
- **Tests:** two E2E tests in `catalog.spec.ts`. Every catalog card has an image with alt text served as WebP/SVG under 30 KB, and the product page shows the model photo.

## Roadmap

- [x] Define project context and architecture
- [x] Local reference app (`56c200a`)
  - [x] Catalog: listing, search, category filter, product details, availability
  - [x] Login with signed session cookie; protected cart, checkout and order pages
  - [x] Cart: add, update, remove, 10-unit limit, stock checks
  - [x] Checkout: address, standard/express delivery, simulated card payment, order confirmation
  - [x] Stock deducted on paid orders; declined payments keep stock and cart
  - [x] Test-only database reset (`POST /api/test/reset`, `npm run db:reset`)
- [x] Playwright E2E suite: 43 tests, page objects, fixtures, DB assertions (`47b4b93`, `f7e68ff`)
- [x] CI workflow for lint, typecheck and E2E on GitHub Actions, green on `main` (`47b4b93`, `68025c6`, `acbdd99`)
- [x] Documentation for the reference app and E2E suite (`23dce6c`, `79b3932`, `45c7c54`)
- [x] Compact product images (WebP photos + SVG drawings) with credits and E2E checks (`f7e68ff`)
- [x] JSON API subset under `/api/v1`, 66 API tests, 12 mocked-API UI tests and test mindmaps; suite now 122 tests (`acbdd99`)
- [x] Allure reporting for UI, mocked-API and API tests, locally and in CI (`acbdd99`)
- [ ] Set up environments (Dev, Staging, Performance)
- [ ] Implement full accounts (sign-up, email verification, password reset, addresses)
- [ ] Replace the simulated payment with Stripe
- [ ] Implement orders, inventory, and shipping (order history, tracking, cancellation, returns, stock reservation)
- [ ] Build admin back office
- [ ] Login rate limiting and account lockout
- [ ] Cross-browser E2E (Firefox, WebKit)
- [ ] Performance and security testing
- [ ] Launch
