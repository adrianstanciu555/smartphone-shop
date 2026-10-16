
# Project Context for AI Assistance

  

## Project Overview

- **Purpose:** Online store for buying smartphones and compatible accessories (cases, chargers, cables, earbuds, screen protectors). Covers catalog browsing (no account required), search and filtering, cart, checkout with online payment (account required), order tracking, and returns.

- **Domain:** Retail e-commerce, consumer electronics (B2C, web-first).

- **Users:**
  - Customers (registered users with an account only; no guest checkout): the majority; assumed ~10k monthly active users at launch.
  - Visitors (no account): can browse the catalog but must register and log in to buy.
  - Catalog and inventory managers: a few; manage products, prices, and stock.
  - Support and fulfillment agents: a few; handle orders, returns, and refunds.

- **Launch Targets:**
  - Expected orders at launch date: 1,000.
  - Minimum initial stock: 2,000 smartphones and 5,000 accessories.

  

## Technical Stack

- **Frontend:** TypeScript, Next.js (React) with server-side rendering for SEO on public catalog pages; Tailwind CSS.

- **Backend:** TypeScript, Node.js with NestJS; modular monolith (Auth, Catalog, Inventory, Cart, Orders, Payments, Shipping) exposed via REST API (OpenAPI). Integrations: payment provider (Stripe) for checkout, courier API for delivery and tracking, email/SMS provider for account and order notifications. Authentication via JWT access tokens with refresh tokens; passwords hashed with Argon2.

- **Database:** PostgreSQL as the primary store (users, addresses, products, stock, carts, orders, payments, shipments); Redis for sessions, cart caching, and rate limiting; OpenSearch (or Postgres full-text at launch) for catalog search and filtering. Stock updates use transactional reservation at checkout to prevent overselling.

- **Infrastructure:** Docker containers on a managed cloud (AWS: ECS Fargate, RDS, ElastiCache, S3 + CloudFront for images and static assets); Terraform for IaC; GitHub Actions CI/CD; Dev, Staging, and Prod environments; monitoring with OpenTelemetry, Grafana/Prometheus, and Sentry.

- **Testing Tools:** Playwright Test with TypeScript as the UI automation framework, using the Page Object Model and fixtures. It covers E2E flows (register, login, cart, checkout, order tracking), run in parallel on Chromium, Firefox, and WebKit and in CI via GitHub Actions. Postman collections for API testing (run in CI with Newman). Allure for reporting (`allure-playwright` for UI results, Newman Allure reporter for API results). Jest for backend unit tests, k6 for load testing against the 1,000-orders launch target, OWASP ZAP for security scans.

  

## Key Features & Modules

1. **[Module Name]:** [Purpose and critical functions]

2. **[Module Name]:** [Purpose and critical functions]

[Continue for all major modules]

  

## Current Testing Approach

- **Manual Testing:** [Scope and tools]

- **Automation:** [Coverage and frameworks]

- **Performance:** [Tools and benchmarks]

- **Security:** [Current practices]

  

## Pain Points & Known Issues

- **Recurring Bugs:** [Pattern analysis]

- **Performance Bottlenecks:** [Identified areas]

- **Testing Gaps:** [Uncovered scenarios]

- **Process Issues:** [Workflow problems]

  

## Business Rules & Constraints

- **Critical User Journeys:** [Must-work scenarios]

- **Compliance Requirements:** [Regulatory needs]

- **Performance SLAs:** [Speed/uptime requirements]

- **Security Policies:** [Data protection rules]

  

## Sample Data & User Roles

- **Test Accounts:** [Available user types]

- **Data Sets:** [Test data availability]

- **Environments:** [Dev/staging/prod access]