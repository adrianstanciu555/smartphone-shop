
# Project Context for AI Assistance

  

## Project Overview

- **Purpose:** Online store for buying smartphones and compatible accessories (cases, chargers, cables, headphones, screen protectors).
Our best selling smartphones brands are: Samsung, Apple, Google, Motorola, Xiaomi, OPPO, HONOR, Sony, Vivo, OnePlus (Android and iOS).
The chargers are from their manufacturer brands or third-party: Anker, Belkin, Spigen, Techsuit, UGREEN, HOCO, McDodo.
The cables and adapters are made by their own brand or by third-parties: Baseus, Anker, Spigen, McDodo, HOCO, Ringke.
Phone cases are made by their our brands or third-party: Techsuit, Nelkin, Nillkin, Basesu, McDodo, Spigen, Ringle, PanzerGlass.
Screen protectorts are their own smarphone brand or third-party like: Techsuit, HOCO, Nillkin, Belkin, Spigen, Ringke, Urban Armor Gear, PanzerGlass.
Bluetooth headphones brands include: Samsung, Apple, Xiaomi, Google, Motorola, JBL, Basesu, HOCO, Philips, Anker, McDodo.

 Covers catalog browsing (no account required), search and filtering, cart, checkout with online payment (account required), order tracking, and returns.

- **Domain:** Retail e-commerce, consumer electronics (B2C, web-first).

- **Users:**
  - Customers (registered users with an account only; no guest checkout): the majority; assumed ~10k monthly active users at launch.
  - Visitors (no account): can browse the catalog but must register and log in to buy.
  - Catalog and inventory managers: a few; manage products, prices, and stock.
  - Support and fulfillment agents: a few; handle orders, returns, and refunds.

- **Launch Targets:**
  - Expected orders at launch date: 1,000.
  - Minimum initial stock at launch: 2,000 smartphones and 5,000 accessories (total units across all products).
  - Stock covers the 1,000 expected launch orders with a safety margin; low-stock alerts apply once stock drops below a defined threshold.

  

## Technical Stack

- **Frontend:** TypeScript, Next.js (React) with server-side rendering for SEO on public catalog pages; Tailwind CSS.

- **Backend:** TypeScript, Node.js with NestJS; modular monolith (Auth, Catalog, Inventory, Cart, Orders, Payments, Shipping) exposed via REST API (OpenAPI). Integrations: payment provider (Stripe) for checkout, courier API for delivery and tracking, email/SMS provider for account and order notifications. Authentication via JWT access tokens with refresh tokens; passwords hashed with Argon2.

- **Database:** PostgreSQL as the primary store (users, addresses, products, stock, carts, orders, payments, shipments); Redis for sessions, cart caching, and rate limiting; OpenSearch (or Postgres full-text at launch) for catalog search and filtering. Stock updates use transactional reservation at checkout to prevent overselling.

- **Infrastructure:** Docker containers on a managed cloud (AWS: ECS Fargate, RDS, ElastiCache, S3 + CloudFront for images and static assets); Terraform for IaC; GitHub Actions CI/CD; Dev, Staging, and Prod environments; monitoring with OpenTelemetry, Grafana/Prometheus, and Sentry.

- **Testing Tools:** Playwright Test with TypeScript as the UI automation framework, using the Page Object Model and fixtures. It covers E2E flows (register, login, cart, checkout, order tracking), run in parallel on Chromium, Firefox, and WebKit and in CI via GitHub Actions. Postman collections for API testing (run in CI with Newman). Allure for reporting (`allure-playwright` for UI results, Newman Allure reporter for API results). Jest for backend unit tests, k6 for load testing against the 1,000-orders launch target, OWASP ZAP for security scans.

  

## Key Features & Modules

1. **User Accounts & Authentication:** Lets visitors become customers and manage their profile. Critical functions: sign up (email and password, email verification), login/logout, password reset, profile and delivery address management.

2. **Product Catalog:** Lists smartphones and accessories for all visitors, no account required. Critical functions: product listing, product details (specs, price, images, availability), search, filtering and sorting (brand, price, category, compatibility).

3. **Shopping Cart:** Holds the customer's selected products before purchase. Critical functions: add, remove, and change quantity; price and total calculation; stock availability check; cart persisted per account.

4. **Checkout & Payments:** Converts the cart into a paid order (login required). Critical functions: delivery address and delivery method selection, order summary, online card payment, payment confirmation or failure handling, order confirmation email.

5. **Order Management & Delivery:** Tracks an order from payment to the customer's location. Critical functions: order history, order status tracking, courier shipment creation and tracking, delivery notifications, order cancellation and returns.

6. **Inventory Management:** Keeps stock accurate and prevents overselling. Critical functions: stock levels per product, stock reservation at checkout, stock deduction on paid order, low-stock alerts, restock updates (launch minimum: 2,000 smartphones, 5,000 accessories).

7. **Admin Back Office:** Used by catalog managers and support agents. Critical functions: product and price management, stock updates, order processing and status updates, handling returns and refunds, customer lookup.

  

## Current Testing Approach

- **Manual Testing:** Exploratory and cross-device checks on Staging; payment edge cases (declined card, 3-D Secure); back office flows (returns, refunds, stock).

- **Automation:** Runs in GitHub Actions on every PR and nightly.
  - Unit: Jest (pricing, stock reservation, order statuses).
  - API: Postman + Newman (all modules, negative and authorization cases).
  - UI/E2E: Playwright + TypeScript (sign up, login, search, cart, checkout, tracking, returns).
  - Reporting: combined Allure report.

- **Performance:** k6 on Staging, plus Lighthouse CI for the frontend.
  - Load, stress, spike, and soak tests; concurrency test on last-unit purchases.
  - Targets: p95 API < 500 ms, LCP < 2.5 s, checkout success > 99%.

- **Security:** Aligned with OWASP Top 10.
  - CI scans: SAST, dependencies, containers (Trivy), secrets.
  - DAST: OWASP ZAP on Staging.
  - Manual-style checks: auth and JWT, access to other users' data (IDOR), injection, price tampering, payment webhooks.
  - Penetration test before launch.
  

## Pain Points & Known Issues

- **Recurring Bugs:**
  - Overselling: two customers buy the last unit, or stock is not released after an abandoned or failed payment.
  - Cart totals wrong after price, discount, or stock changes.
  - Duplicate orders or charges from double-clicks and payment webhook retries.
  - Order stays in "Pending" after a successful payment (missed webhook).
  - Search and filters return wrong results (compatibility, out-of-stock items).
  - Address and phone validation rejecting valid input; emails not delivered.

- **Performance Bottlenecks:**
  - Catalog listing and search with many filters.
  - Large product images slowing page load (LCP).
  - Checkout: stock-reservation locks on popular products under concurrent load.
  - Slow third-party calls (payment, courier) blocking requests.
  - Database connection exhaustion at launch peaks.

- **Testing Gaps:**
  - Payment failure paths: webhook delays, retries, and out-of-order events.
  - Concurrent purchases of the last unit across multiple sessions.
  - Courier and email/SMS integrations (sandboxes are limited).
  - Back office and admin flows have little automation.
  - Returns and refunds across the 30-day window boundary.
  - Accessibility and mobile browser coverage.
  - Production-scale data volumes in performance tests.

- **Process Issues:**
  - Stock and price data differ between environments, so bugs are not reproducible.
  - Third-party sandboxes (Stripe, courier) are unstable or limited.
  - Late requirement changes without updated tests or API contracts.
  - No agreed definition of done for performance and security checks.

  

## Business Rules & Constraints

- **Critical User Journeys:**
  - Sign up, verify email, log in.
  - Browse, search, and filter products (no account).
  - Add to cart, checkout, pay, receive confirmation.
  - Track order until delivery.
  - Cancel or return an order and receive a refund.

- **Business Rules:**
  - Only registered, logged-in users can add to cart and buy; browsing is open.
  - Stock is reserved at checkout and released if payment fails or times out.
  - An out-of-stock product cannot be purchased.
  - Price is confirmed server-side at checkout, never trusted from the client.
  - Orders can be cancelled before shipment; returns are allowed within 30 days of delivery.
  - Refunds go back to the original payment method.

- **Compliance Requirements:**
  - GDPR: consent, data access, export, and deletion for customer accounts.
  - PCI DSS: card data handled only by the payment provider (Stripe).
  - Consumer protection: price with taxes shown, right of withdrawal, clear terms and privacy policy.
  - Cookie consent.

- **Performance SLAs:**
  - Availability 99.9%.
  - p95 API response < 500 ms; catalog page LCP < 2.5 s.
  - Checkout success rate > 99%.
  - Capacity: 1,000 orders at launch, ~10k monthly active users.

- **Security Policies:**
  - HTTPS everywhere; passwords hashed (Argon2); strong password rules.
  - Customers access only their own data; role-based access for staff.
  - No card data stored; personal data encrypted at rest.
  - Rate limiting and account lockout on login; audit log for admin actions.

  

## Sample Data & User Roles

- **Test Accounts:** (synthetic only, no real customer data; credentials kept in a secrets manager, not in the repo)
  - Visitor: no account, catalog browsing only.
  - Customer (new): freshly registered, email verified, no orders.
  - Customer (existing): verified, saved address, order history (paid, shipped, delivered, cancelled, returned).
  - Customer (unverified): registered but email not verified.
  - Customer (locked): account locked after failed logins.
  - Customer (return window): delivered order at day 29 and day 31, to test the 30-day rule.
  - Catalog/inventory manager: manages products, prices, and stock.
  - Support/fulfillment agent: processes orders, returns, and refunds.
  - Admin: full back office access, including user and role management and audit log review.
  - Second customer: used to verify access to another user's data is blocked (IDOR).

- **Data Sets:**
  - Catalog: ~200 smartphones and ~800 accessories (multiple brands, prices, categories, compatibility), including a product with no stock and one with 1 unit left.
  - Stock: launch-scale set of 2,000 smartphone units and 5,000 accessory units (spread across the catalog products) on the performance environment; Dev and Staging use a smaller set.
  - Users: ~10k generated customers for load tests, plus seed data created via API or database scripts and reset before each run.
  - Payments: Stripe test cards for success, declined, insufficient funds, 3-D Secure, and timeout.
  - Addresses: valid and invalid samples, including special characters and international formats.
  - Orders: sample orders in every status.
  - Security: payloads for injection, XSS, and tampered prices.

- **Environments:**
  - Dev: developers' daily work, mocked third parties, small data set; QA has full access.
  - Staging: production-like, Stripe test mode and courier sandbox, anonymized or synthetic data; used for E2E, API, DAST, and nightly runs.
  - Performance: Staging-sized infrastructure with launch-scale data; used for k6 tests only.
  - Production: no test data; read-only monitoring and a post-release smoke test with a dedicated test account.
