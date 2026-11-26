# Smartphone Shop

Online store for buying smartphones and compatible accessories (cases, chargers, cables, earbuds, screen protectors).

> **Status:** In progress. The target architecture is documented in [docs/context.md](docs/context.md). A local reference app ([frontend/](frontend/README.md)) implements the core customer journey (catalog, login, cart, checkout) and is covered by a Playwright E2E suite ([tests/e2e/](tests/e2e/README.md)).

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

The local reference app uses only part of this stack: Next.js with server actions talking to PostgreSQL directly, a signed session cookie, and a simulated card payment. See [frontend/README.md](frontend/README.md) for details.

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
```

## Project Structure

Current layout. The full target tree, including `backend/` and `infrastructure/`, is in [docs/mindmap.md](docs/mindmap.md).

```text
smartphone-shop/
├── docs/                # Project documentation, OpenAPI contract, test data
├── frontend/            # Next.js reference app (catalog, login, cart, checkout)
├── database/            # PostgreSQL schema and seeds
├── tests/e2e/           # Playwright + TypeScript E2E suite
└── .github/workflows/   # CI (E2E on push and pull request)
```

Planned, not yet created: `backend/` (NestJS API) and `infrastructure/` (Docker, Terraform).

## Testing Strategy

- **Unit:** Jest
- **API:** Postman collections run with Newman
- **UI/E2E:** Playwright with TypeScript (see [tests/e2e](tests/e2e/README.md))
- **Performance:** k6 load, stress, spike, and soak tests
- **Security:** OWASP Top 10 checks, dependency and container scans, OWASP ZAP
- **Reporting:** Allure

## Business Rules

- Browsing is open; adding to cart and buying require a registered account.
- Stock is reserved at checkout and released if payment fails.
- Returns are accepted within 30 days of delivery.
- Card data is handled only by the payment provider (PCI DSS).
- GDPR applies to customer data.

## Documentation

- [Project context](docs/context.md): overview, requirements, testing approach, and constraints
- [Frontend reference app](frontend/README.md): setup, routes, test cards, and business rules as implemented
- [E2E tests](tests/e2e/README.md): Playwright framework, commands, and conventions
- [OpenAPI contract](docs/openapi.yaml): target REST API for the NestJS backend
- [Project mindmap](docs/mindmap.md): structure and flow
- [Prompt examples](docs/prompt-examples.md)

## Implementation Status

What the first implementation commits delivered (verified on 2026-11-26 from a clean checkout of `16efccf`):

| Commit | Scope | Contents |
| --- | --- | --- |
| `619ee40` | Reference app | Next.js 16 app in `frontend/`: catalog with search and category filter, product page, login (auto-registers new emails), cart (max 10 units per product, stock checks), checkout (address, standard/express delivery, simulated card payment), order confirmation, test-only `POST /api/test/reset`. Fixes the delivery method resetting to Standard after a failed checkout submit; adds product and order page titles. |
| `557d7c9` | E2E suite and CI | Playwright + TypeScript framework in `tests/e2e/` (page objects, fixtures, PostgreSQL helper, test data) with 41 tests. GitHub Actions workflow `.github/workflows/e2e.yml` with a Postgres 17 service. |
| `16efccf` | Documentation | Frontend and E2E READMEs, this README, a "Current Implementation" section in `docs/context.md`, a scope note in `docs/openapi.yaml`. |

E2E coverage (41 tests, 4 tagged `@smoke`):

| Spec | Tests | Covers |
| --- | --- | --- |
| `auth.spec.ts` | 8 | First login creates the account, returning login, wrong password, case-insensitive email, field validation, return URL, open-redirect protection, logout |
| `catalog.spec.ts` | 10 | Product list, search, category filter, combined filters, empty state, SQL wildcards, unknown category, product page, out-of-stock, 404 |
| `cart.spec.ts` | 9 | Login required, add with quantity, merge quantities, 10-unit limit, update totals, browser max validation, remove items, empty-cart checkout redirect |
| `checkout.spec.ts` | 9 | Paid order with stock deduction, delivery fees, declined card with retry, express delivery kept after errors, required fields, 4 invalid-card cases |
| `access-control.spec.ts` | 5 | Anonymous redirects (cart, checkout, order), another customer's order returns 404, tampered session cookie |

Verification results:

| Check | Result |
| --- | --- |
| `npm ci`, `npm run lint`, `npx next typegen` + `npx tsc --noEmit` (frontend) | Pass |
| `npm ci`, `npm run typecheck` (tests/e2e) | Pass |
| `npx playwright test` with `CI=true` (production build, 2 workers) | 41 passed in 1.3 min |
| Relative links in the README files | All valid |
| GitHub Actions run | Not run yet (commits not pushed) |

Known limitation: in an early manual test, one add-to-cart with quantity 2 added only 1 unit. It could not be reproduced in more than 10 later attempts or in the automated suite.

### Product images

One small image per product (48 files, about 55 KB in total, 320 px, each under 13 KB), seeded into `product_images` from `docs/product-images.csv` and shown on the catalog cards and product page.

- **Photos:** six phone models (iPhone 15, Pixel 8, Galaxy S24, Xperia 1 V, OPPO Find X7, Vivo X100) use freely licensed Wikimedia Commons photos (CC BY-SA 4.0 / CC0), converted to WebP.
- **Drawings:** HONOR Magic6, Motorola Edge 40, OnePlus Nord 3, Redmi Note 13 and all accessories use SVG drawings, because no suitable free photo exists.
- **Generator:** `npm run images:build` in `frontend/`.
- **Credits:** [frontend/public/products/ATTRIBUTION.md](frontend/public/products/ATTRIBUTION.md).
- **Tests:** two new E2E tests (43 in total). Every catalog card has an image with alt text served as WebP/SVG under 30 KB, and the product page shows the model photo.

## Roadmap

- [x] Define project context and architecture
- [x] Local reference app (`619ee40`)
  - [x] Catalog: listing, search, category filter, product details, availability
  - [x] Login with signed session cookie; protected cart, checkout and order pages
  - [x] Cart: add, update, remove, 10-unit limit, stock checks
  - [x] Checkout: address, standard/express delivery, simulated card payment, order confirmation
  - [x] Stock deducted on paid orders; declined payments keep stock and cart
  - [x] Test-only database reset (`POST /api/test/reset`, `npm run db:reset`)
- [x] Playwright E2E suite: 41 tests, page objects, fixtures, DB assertions (`557d7c9`)
- [x] CI workflow for lint, typecheck and E2E on GitHub Actions (`557d7c9`)
- [x] Documentation for the reference app and E2E suite (`16efccf`)
- [x] Compact product images (WebP photos + SVG drawings) with credits and E2E checks
- [ ] Set up environments (Dev, Staging, Performance)
- [ ] Implement full accounts (sign-up, email verification, password reset, addresses)
- [ ] Replace the simulated payment with Stripe
- [ ] Implement orders, inventory, and shipping (order history, tracking, cancellation, returns, stock reservation)
- [ ] Build admin back office
- [ ] Cross-browser E2E (Firefox, WebKit) and Allure reporting
- [ ] Performance and security testing
- [ ] Launch
