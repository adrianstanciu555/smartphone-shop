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

## Roadmap

- [x] Define project context and architecture
- [x] Local reference app: catalog, login, cart, checkout with simulated payment
- [x] Playwright E2E suite and CI workflow
- [ ] Set up environments (Dev, Staging, Performance)
- [ ] Implement full accounts (sign-up, email verification, password reset, addresses)
- [ ] Replace the simulated payment with Stripe
- [ ] Implement orders, inventory, and shipping
- [ ] Build admin back office
- [ ] Performance and security testing
- [ ] Launch
