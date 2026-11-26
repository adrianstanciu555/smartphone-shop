# Smartphone Shop: Frontend (local reference app)

A small Next.js app implementing the customer journey from [docs/context.md](../docs/context.md): catalog, login, cart, checkout and order confirmation. It is the system under test for the Playwright suite in [tests/e2e](../tests/e2e/README.md).

It talks to PostgreSQL directly from server components and server actions. There is no separate backend yet. A small JSON API under `/api/v1` implements a cookie-authenticated subset of the REST contract in [docs/openapi.yaml](../docs/openapi.yaml), reusing the same `lib/` logic (see [API tests](../tests/e2e/README.md#api-tests)).

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4
- PostgreSQL 17 via `pg` (parameterized SQL), schema from [database/migrations/schema.sql](../database/migrations/schema.sql)
- `@node-rs/argon2` password hashing, `jose` HS256 session cookie (8 hours), `zod` validation

## Setup

1. Install PostgreSQL 17 and create a database and an owner role, for example `smartphone_shop` owned by `shop_app`. The reset drops and recreates the `public` schema and creates the `citext` and `pg_trgm` extensions, so the role must be allowed to do that.
2. Copy `.env.example` to `.env.local` and fill in the values:

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | Postgres connection string |
   | `SESSION_SECRET` | At least 32 random characters used to sign the session cookie |
   | `ENABLE_TEST_RESET` | `true` enables `POST /api/test/reset` (local/test only) |

3. Install dependencies and create the schema with seed data:

   ```bash
   cd frontend
   npm ci
   npm run db:reset
   ```

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` / `npm run start` | Production build and server |
| `npm run lint` | ESLint |
| `npx next typegen` then `npx tsc --noEmit` | Type-check (generate route types first) |
| `npm run db:reset` | Drop, recreate and reseed the database |
| `npm run images:build` | Regenerate product images, `docs/product-images.csv` and the credits (needs internet; outputs are committed) |

## Routes

| Route | Access | Description |
| --- | --- | --- |
| `/` | Public | Redirects to `/catalog` |
| `/catalog?q=&category=` | Public | Product list with search and category filter; the search box shows live suggestions from `GET /api/v1/products` |
| `/product/[id]` | Public | Product details and add to cart (404 for unknown ids) |
| `/login?next=` | Public | Login; returns to `next` (same-site paths only) |
| `/cart` | Customer | Change quantities, remove items |
| `/checkout` | Customer | Address, delivery method and card payment |
| `/orders/[id]` | Customer | Order confirmation (404 for other customers' orders) |
| `/api/v1/...` | Mixed | JSON API: `auth/login`, `auth/logout`, `users/me`, `products`, `products/{id}`, `categories` (public), `cart`, `cart/items`, `cart/items/{productId}`, `checkout`, `orders/{id}` (need the session cookie) |
| `POST /api/test/reset` | Test only | Resets the database; 404 unless `ENABLE_TEST_RESET=true` |

## Behaviour and test data

- **Login:** an unknown email creates an active customer account with that password. The display name is the part before `@`. A known email must match its password. There is no sign-up form, email verification or password reset yet.
- **Catalog:** 100 products from [docs/products-seed.csv](../docs/products-seed.csv). Available products have 50 units in stock; unavailable ones have 0 and cannot be added to the cart.
- **Search suggestions:** after at least 2 characters, the search box waits 250 ms and shows up to 5 matching products from `GET /api/v1/products`, with links to their pages. On an API error it shows "Suggestions are unavailable"; the Apply button still runs the normal search.
- **Images:** one image per product, seeded into `product_images` from [docs/product-images.csv](../docs/product-images.csv) and served from `public/products/` (48 files, about 55 KB in total, each 320 px and under 13 KB). Six phone models use freely licensed Wikimedia Commons photos converted to WebP: iPhone 15, Pixel 8, Galaxy S24, Xperia 1 V, Find X7 and X100. All storage variants of a model share the photo. HONOR Magic6, Motorola Edge 40, OnePlus Nord 3, Redmi Note 13 and all accessories use simple SVG drawings, because no suitable free photo exists. Credits and licences are in [public/products/ATTRIBUTION.md](public/products/ATTRIBUTION.md).
- **Cart:** one active cart per customer, at most 10 units per product and never more than the stock.
- **Prices:** EUR, 5% VAT already included in the price.
- **Delivery:** standard costs €4.99, free when the subtotal is €50.00 or more; express always costs €9.99.
- **Payment:** a simulated provider (about 800 ms in the UI, no delay through the API) instead of Stripe. Card numbers are checked for format, Luhn checksum, future MM/YY expiry and a 3-digit CVC.

  | Card | Result |
  | --- | --- |
  | `4242 4242 4242 4242` | Paid: stock is deducted and the cart is converted |
  | `4000 0000 0000 0002` | Declined: order `payment_failed`, stock unchanged, cart kept for a retry |
  | Any other valid number | Rejected as an unsupported test card |

- **JSON API:** same rules as the UI, with the endpoints, error codes and differences from the OpenAPI contract described in [tests/e2e/README.md](../tests/e2e/README.md#api-tests) and the `docs/openapi.yaml` description.

## Known limitations

- No rate limiting or account lockout on login (form and API).
- No stock reservation: checkout locks the stock rows and deducts stock only when the payment succeeds.
- The search suggestions panel has no close action; it hides when the term is shorter than 2 characters.

## Structure

```text
frontend/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (public)/              # catalog, product/[id]
│   ├── (customer)/            # cart, checkout, orders/[id] (require a session)
│   ├── actions/               # Server actions: auth, cart, checkout
│   ├── api/v1/                # JSON API route handlers (auth, users, products, categories, cart, checkout, orders)
│   └── api/test/reset/        # Test-only database reset
├── components/                # Forms and UI parts, incl. SearchBox (client, live suggestions); all controls have labels and data-testid
├── lib/                       # db, session, users, products, cart, orders, money, reset-database, api (JSON helpers), checkout-schema (shared validation)
├── public/products/           # Product images (phones/*.webp|svg, accessories/*.svg) and ATTRIBUTION.md
└── scripts/                   # db-reset.ts (CLI reset), build-product-images.ts (images:build)
```

Before changing Next.js code, read [AGENTS.md](AGENTS.md): Next 16 has breaking changes, and its docs are in `node_modules/next/dist/docs`.
