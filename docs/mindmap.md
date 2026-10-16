# Smartphone Shop - Project Mindmap

```text
smartphone-shop/
├── docs/                          # Project documentation
│   ├── context.md
│   ├── mindmap.md
│   └── prompt-examples.md
│
├── frontend/                      # Next.js + TypeScript + Tailwind
│   ├── app/
│   │   ├── (public)/              # No account needed
│   │   │   ├── catalog/           # Product list, search, filters
│   │   │   └── product/[id]/      # Product details
│   │   ├── (auth)/                # Sign up, login, password reset
│   │   ├── (customer)/            # Login required
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/            # History, tracking, returns
│   │   │   └── profile/           # Details, delivery addresses
│   │   └── (admin)/               # Back office (staff only)
│   │       ├── products/
│   │       ├── inventory/
│   │       ├── orders/
│   │       └── users/
│   ├── components/
│   └── lib/                       # API client
│
├── backend/                       # NestJS modular monolith (REST API)
│   └── src/
│       ├── auth/                  # Sign up, login, JWT, roles
│       ├── users/                 # Profiles, addresses
│       ├── catalog/               # Products, categories, search
│       ├── cart/
│       ├── checkout/              # Payment flow, Stripe webhooks
│       ├── orders/                # Statuses, cancellation, returns
│       ├── inventory/             # Stock levels, reservation, alerts
│       ├── shipping/              # Courier integration, tracking
│       ├── notifications/         # Email and SMS
│       ├── admin/                 # Back office endpoints
│       └── common/                # Config, guards, logging
│
├── database/
│   ├── migrations/                # PostgreSQL schema
│   └── seeds/                     # Catalog, stock, test users
│
├── infrastructure/
│   ├── docker/
│   └── terraform/                 # AWS: ECS, RDS, ElastiCache, S3
│
├── .github/workflows/             # CI/CD pipelines
│
└── tests/
    ├── unit/                      # Jest
    ├── api/                       # Postman collections + Newman
    ├── e2e/                       # Playwright + TypeScript
    │   ├── pages/                 # Page objects
    │   ├── fixtures/
    │   └── specs/                 # register, cart, checkout, tracking
    ├── performance/               # k6 scripts
    ├── security/                  # OWASP ZAP config
    └── reports/                   # Allure
```

## Main Flow

```text
Visitor
├── Browses catalog (no account)
└── Signs up / logs in
    └── Customer
        ├── Adds products to cart
        ├── Checkout and online payment (Stripe)
        ├── Order confirmed, stock deducted
        ├── Courier delivers to customer's address
        └── Tracks order / returns within 30 days
```

## External Services

```text
Smartphone Shop
├── Stripe          # Payments
├── Courier API     # Delivery and tracking
└── Email / SMS     # Account and order notifications
```
