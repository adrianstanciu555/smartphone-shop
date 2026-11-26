# Smartphone Shop - Project Mindmap

## Summary

Smartphone Shop is a B2C online store for smartphones and accessories. The repository has two layers:

- **Target architecture (planned):** a Next.js frontend, a NestJS REST backend ([docs/openapi.yaml](openapi.yaml)), PostgreSQL, Redis and OpenSearch, Stripe, courier and email integrations, and AWS infrastructure. It is described in [docs/context.md](context.md).
- **Current implementation:**
  - A local Next.js 16 reference app in [frontend/](../frontend/README.md) covers the core journey: catalog, login, cart, checkout with a simulated card payment, and order confirmation. It talks to PostgreSQL directly and also serves a small cookie-authenticated JSON API under `/api/v1`.
  - A Playwright + TypeScript suite in [tests/e2e/](../tests/e2e/README.md) tests it with 122 tests: 44 UI, 12 mocked-API UI and 66 REST API. It reports to the Playwright HTML report and Allure Report 3, and runs in GitHub Actions.
  - Test design documents, test data, and earlier exploratory runs with the Playwright MCP server are kept next to the app.

Related documents:

| Document | What it shows |
| --- | --- |
| [README.md](../README.md) | Project overview, quick start, implementation status, coverage and roadmap |
| [tests/e2e/framework-mindmap.md](../tests/e2e/framework-mindmap.md) | Mindmap of the whole Playwright framework: setup, layers, conventions and all 122 tests |
| [tests/e2e/tests/api/api-tests-mindmap.md](../tests/e2e/tests/api/api-tests-mindmap.md) | Mindmap of the 66 REST API tests and the 12 mocked-API UI tests |
| [tests/e2e/ALLURE.md](../tests/e2e/ALLURE.md) | How to run, read and extend the Allure reports locally and in CI |
| [tests/e2e/README.md](../tests/e2e/README.md) | Commands, environment variables, API tests, API mocks and conventions |
| [frontend/README.md](../frontend/README.md) | Reference app setup, routes, test cards and business rules as implemented |

All diagrams below are Mermaid. They render on GitHub and in the VS Code Markdown preview, with white text on dark fills so every node stays readable in light and dark themes.

## Current project (implemented)

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#1e293b", "primaryTextColor": "#ffffff",
    "git0": "#1e293b", "gitBranchLabel0": "#ffffff",
    "cScale0": "#334155", "cScaleLabel0": "#ffffff",
    "cScale1": "#1d4ed8", "cScaleLabel1": "#ffffff",
    "cScale2": "#7e22ce", "cScaleLabel2": "#ffffff",
    "cScale3": "#047857", "cScaleLabel3": "#ffffff",
    "cScale4": "#b45309", "cScaleLabel4": "#ffffff",
    "cScale5": "#be123c", "cScaleLabel5": "#ffffff",
    "cScale6": "#0e7490", "cScaleLabel6": "#ffffff",
    "cScale7": "#4338ca", "cScaleLabel7": "#ffffff"
  }
}}%%
mindmap
  root((Smartphone Shop - current))
    frontend - Next.js 16 reference app
      Pages
        Catalog with search, category filter, live suggestions
        Product details with image and availability
        Login - unknown email auto-registers
        Cart - max 10 units per product
        Checkout - address, delivery, simulated card
        Order confirmation - own orders only
      Server actions
        auth, cart, checkout
      JSON API v1
        auth login, logout, users me
        products, categories - public
        cart, cart items - session cookie
        checkout with Idempotency-Key
        orders by id
      Test only
        POST api test reset - when ENABLE_TEST_RESET is true
      lib
        db, session, users, products
        cart, orders, money
        api helpers, checkout schema
    database
      migrations - schema.sql
      seeds - products, users, customer data
      PostgreSQL 17, local Windows service
      100 products, stock 50 or 0, 5 percent VAT
    tests e2e - Playwright and TypeScript
      Projects
        chromium - 44 UI and 12 mocked-API tests
        api - 66 REST API tests, no browser
      Framework
        Page objects and fixtures
        ApiClient and response contracts
        ProductsApiMock with page.route
        DbHelper for database assertions
      Reports
        Playwright HTML report
        Allure Report 3 - labels, API attachments, history
      Mindmaps - framework and API tests
    CI - GitHub Actions
      Postgres 17 service, Node 24
      Frontend lint, E2E typecheck
      Runs all 122 tests
      Uploads HTML report, Allure report, traces
    docs - test design and data
      context.md and openapi.yaml
      User story analysis, refinement questions
      Classic and BDD test cases, checklist
      Bug reports and bug analysis
      Test data - seeds, profiles, emails, anonymized customers
      Prompt examples
    Exploratory runs with Playwright MCP
      accessibility-testing - WCAG report, GlobalSQA
      demoblaze - checkout flow report
      saucedemo - login scenarios
      playwright-output - page snapshots and logs
      figma-output - mock design
```

## Target architecture (planned)

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#1e293b", "primaryTextColor": "#ffffff",
    "git0": "#1e293b", "gitBranchLabel0": "#ffffff",
    "cScale0": "#334155", "cScaleLabel0": "#ffffff",
    "cScale1": "#1d4ed8", "cScaleLabel1": "#ffffff",
    "cScale2": "#7e22ce", "cScaleLabel2": "#ffffff",
    "cScale3": "#047857", "cScaleLabel3": "#ffffff",
    "cScale4": "#b45309", "cScaleLabel4": "#ffffff",
    "cScale5": "#be123c", "cScaleLabel5": "#ffffff",
    "cScale6": "#0e7490", "cScaleLabel6": "#ffffff",
    "cScale7": "#4338ca", "cScaleLabel7": "#ffffff"
  }
}}%%
mindmap
  root((Smartphone Shop - target))
    Frontend - Next.js, TypeScript, Tailwind
      Public - catalog, product details
      Auth - sign up, login, password reset
      Customer - cart, checkout, orders, profile
      Admin - products, inventory, orders, users
      SSR for SEO on catalog pages
    Backend - NestJS modular monolith
      auth - JWT access and refresh tokens, roles
      users - profiles, addresses
      catalog - products, categories, search
      cart and checkout - Stripe payment flow, webhooks
      orders - statuses, cancellation, returns
      inventory - reservation, low-stock alerts
      shipping - courier, tracking
      notifications - email and SMS
      admin - back office endpoints
      REST contract in openapi.yaml
    Data
      PostgreSQL - primary store
      Redis - sessions, cart cache, rate limiting
      OpenSearch - catalog search
      S3 and CloudFront - images
    Integrations
      Stripe - payments
      Courier API - delivery and tracking
      Email and SMS provider
    Infrastructure
      Docker on AWS ECS Fargate
      RDS, ElastiCache
      Terraform
      Dev, Staging, Performance, Production
      OpenTelemetry, Grafana, Prometheus, Sentry
    Testing
      Unit - Jest
      API - Postman and Newman
      UI and E2E - Playwright on Chromium, Firefox, WebKit
      Performance - k6, Lighthouse CI
      Security - OWASP ZAP, SAST, Trivy
      Reporting - combined Allure report
```

What exists today versus the plan:

| Area | Today | Planned |
| --- | --- | --- |
| Backend | Next.js server actions plus a JSON API subset under `/api/v1`, cookie session | NestJS REST API with JWT access and refresh tokens |
| Auth | Login auto-registers unknown emails | Sign up, email verification, password reset, lockout |
| Payment | Simulated cards (`4242...` paid, `4000...0002` declined) | Stripe with webhooks |
| Stock | Deducted when payment succeeds, rows locked during checkout | Reservation at checkout, released on failure or timeout |
| API tests | Playwright `api` project (66 tests) | Postman and Newman as well |
| Browsers | Chromium | Chromium, Firefox, WebKit |
| Reporting | Playwright HTML and Allure 3 | Combined Allure report for all test types |

## Main flow

Green steps work in the reference app today; gray steps are planned.

```mermaid
flowchart TD
  V["Visitor"] --> B["Browses catalog, no account"]
  B --> L["Logs in - new email auto-registers"]
  B -.-> S["Signs up and verifies email"]
  S -.-> C
  L --> C["Customer"]
  C --> A["Adds products to cart, max 10 per product"]
  A --> P["Checkout and card payment - simulated today, Stripe planned"]
  P --> O["Order confirmed, stock deducted"]
  P --> D["Payment declined - stock and cart kept, retry"]
  O -.-> R["Courier delivers to the customer's address"]
  R -.-> T["Tracks order, returns within 30 days"]

  classDef done fill:#047857,stroke:#065f46,color:#ffffff
  classDef planned fill:#475569,stroke:#334155,color:#ffffff,stroke-dasharray:4 3
  class V,B,L,C,A,P,O,D done
  class S,R,T planned
```

## External services

All three are planned; the reference app has no external integrations yet.

```mermaid
flowchart LR
  Shop["Smartphone Shop"] -.-> Stripe["Stripe - payments"]
  Shop -.-> Courier["Courier API - delivery and tracking"]
  Shop -.-> Notify["Email and SMS - account and order notifications"]

  classDef core fill:#1e293b,stroke:#0f172a,color:#ffffff
  classDef planned fill:#475569,stroke:#334155,color:#ffffff,stroke-dasharray:4 3
  class Shop core
  class Stripe,Courier,Notify planned
```
