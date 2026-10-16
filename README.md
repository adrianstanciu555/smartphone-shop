# Smartphone Shop

Online store for buying smartphones and compatible accessories (cases, chargers, cables, earbuds, screen protectors).

> **Status:** Planning. The architecture and documentation are defined; implementation has not started.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
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

## Project Structure

Planned layout (see [docs/mindmap.md](docs/mindmap.md) for the full tree):

```text
smartphone-shop/
├── docs/              # Project documentation
├── frontend/          # Next.js application
├── backend/           # NestJS API
├── database/          # Migrations and seeds
├── infrastructure/    # Docker and Terraform
├── .github/workflows/ # CI/CD
└── tests/             # Unit, API, E2E, performance, security
```

## Testing Strategy

- **Unit:** Jest
- **API:** Postman collections run with Newman
- **UI/E2E:** Playwright with TypeScript
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
- [Project mindmap](docs/mindmap.md): structure and flow
- [Prompt examples](docs/prompt-examples.md)

## Roadmap

- [x] Define project context and architecture
- [ ] Set up repository, CI, and environments
- [ ] Implement accounts, catalog, cart, and checkout
- [ ] Implement orders, inventory, and shipping
- [ ] Build admin back office
- [ ] Performance and security testing
- [ ] Launch
