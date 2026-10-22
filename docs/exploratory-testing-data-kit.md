# Exploratory Testing: Personas and Scenarios

Products, prices and stock come from `docs/products-seed.csv` and `database/seeds/products.sql`. Existing customers and orders (for example `3f6c1a52-8b1e-4d3a-9c47-1a2b3c4d5e01`, Anna Petrova) are in `database/seeds/customer_data_original.sql`.

**Pricing rules used in all expected results**

| Rule | Value |
|---|---|
| Tax | Every seeded product has a 5% rate already included in the price. `tax_total = sum(round(line_total × 5 / 105, 2))`, rounded per line |
| Shipping | `standard` costs 0.00 (matches the seeded orders). `express` costs 9.99. Shipping is not taxed |
| Coupons | Apply after tax, on the tax-inclusive price. They reduce `total` but not `tax_total` |
| `BF2026` | 20% off, 1 unit per product, valid 2026-11-27 00:00 to 2026-11-30 23:59. Discount per unit is rounded to 2 decimals |
| Total | `total = subtotal − discount_total + shipping_total` |
| Stock | Available products start with 50 units, unavailable products with 0 |

**Shared test data**

| Item | Value |
|---|---|
| Declined card | `4000 0000 0000 0002` (used in `docs/bug-analysis-report.md`) |
| Successful card | `4242 4242 4242 4242`, any future expiry, any CVC (standard payment-provider test card; confirm it in your sandbox) |
| Compliant password | `Str0ng!Pass1` (8 to 128 characters, with uppercase, lowercase, digit and special character) |
| Email domain | `@smartphone-shop.test` (avoids clashing with seeded customers) |

---

## Persona 1: Margaret Hughes, senior citizen with limited tech experience

| Attribute | Value |
|---|---|
| Age and birthdate | 75, `1951-03-14` |
| Location | `14 Orchard Close, Bath, BA1 2QT, GB` |
| Contact | `margaret.hughes@smartphone-shop.test`, `+44 7700 900871` |
| Device | 10-year-old Windows laptop, Edge browser, zoomed to 150% to 200%, slow Wi-Fi |
| Tech skills | Email and video calls only. Types slowly, makes typos, double-clicks buttons, uses the Back button a lot |
| Goal | Buy a phone her grandson recommended, plus a case, and have it delivered to her home |
| Frustrations | Long forms, jargon, error messages that don't say what to fix, timeouts |
| Priorities to test | Clarity, forgiving input, error messages, accessibility, no accidental duplicate payments |

| # | Scenario | Test data | Explore and watch for |
|---|---|---|---|
| 1.1 | Register, with mistakes first | Email `margaret.hughes@gmail,com`, then `margaret.hughes@smartphone-shop.test`. Passwords `password`, `Password1`, then `Str0ng!Pass1`. Name `Margaret Hughes` | Whether each error says what to fix (missing special character, missing uppercase). Whether typed data is kept after an error. Whether the password can be shown. Whether the verification email is clear. |
| 1.2 | Search with typos and find an unavailable phone | Search `samsng galxy`, `iphone cas`, `Samsung Galaxy S24 128GB` (price 899.99, unavailable) | Whether search tolerates typos. How "out of stock" is shown on the product page and in the cart. Whether she can still add it, and whether any alternative is suggested. |
| 1.3 | Buy with Back button and double-click on Pay | Cart: `Apple iPhone 15 256GB` (1099.99) plus `Spigen Slim Case for iPhone 15` (19.99). Subtotal 1119.98, tax 53.33, standard shipping 0.00, total 1119.98. Card `4242 4242 4242 4242`. Double-click Pay, then press Back and Pay again | Only one order is created and one payment taken (idempotency). The total shows 1119.98 and the 5% tax is included, not added on top. Stock drops by 1 only. A clear confirmation page. |
| 1.4 | Forgotten password | Request a reset for `margaret.hughes@smartphone-shop.test`. Use the link, set `password1` (rejected), then `N3w!Passw0rd`. Reuse the same link afterwards. Wait more than 24 hours for the link to expire if you can | Rejected weak passwords explain why. The used link no longer works. An expired link gives a helpful message and a way to ask for a new one. An unknown email gives the same neutral message. |
| 1.5 | Return a delivered order | Order delivered 29 days ago, then one delivered 31 days ago. Item `Spigen Slim Case for iPhone 15`. Reason `Does not fit` | The 30-day window is enforced (29 days is allowed, 31 days returns an error). The error message is understandable. Order status shows `return_requested`. She can find the return option without help. |

**Accessibility sweep for this persona:** zoom to 200% (no clipped buttons), keyboard-only navigation, tab order on the checkout form, colour contrast, text size on prices, and a session timeout warning.

---

## Persona 2: Dana Moreau, busy parent shopping for a family

| Attribute | Value |
|---|---|
| Age and birthdate | 38, `1988-06-02` |
| Location | `12 Rue de Rivoli, Paris, 75004, FR`. Second address: grandmother at `Strada Victoriei 25, București, 010065, RO` |
| Contact | `dana.moreau@smartphone-shop.test`, `+33 6 12 34 56 99` |
| Device | Phone (Chrome on Android) at night, laptop at work. Switches between them |
| Tech skills | Comfortable with apps. Shops in short bursts and is often interrupted |
| Goal | Phones and accessories for two teenagers, a charger for the family, and a gift for her mother |
| Frustrations | Losing the cart, surprises at checkout, slow pages |
| Priorities to test | Cart persistence, several items and quantities, multiple addresses, payment retry, delivery options |

| # | Scenario | Test data | Explore and watch for |
|---|---|---|---|
| 2.1 | Family cart with several items | 2 × `Xiaomi Redmi Note 13 128GB` (249.99), 2 × `Ringke Clear Case for Redmi Note 13` (14.99), 2 × `Nillkin Full Cover Glass for Redmi Note 13` (11.99). Subtotal 553.94, tax 26.38. Total 553.94 with standard shipping, 563.93 with express (+9.99) | Line totals (499.98, 29.98, 23.98) and the subtotal add up. Quantity changes update totals at once. Tax is shown as included in the price. The same total appears in the cart, checkout and confirmation email. |
| 2.2 | Cart across two devices and a session timeout | Add `Anker 65W GaN Charger White` (39.99) on the phone, log in on the laptop, then wait until the session expires and refresh | The cart is kept after login and merged correctly with a guest cart. An expired session sends her to login and returns her to the cart. Nothing is lost or duplicated. |
| 2.3 | Item becomes unavailable while in the cart | Add `Xiaomi Redmi Note 13 256GB` (299.99, unavailable). Also add `UGREEN 20W USB-C Charger Black` (15.99) and set the quantity to 51, then 50, then 0 and -1 | An unavailable item is flagged in the cart and blocks checkout, or is removed with a message. Quantity 51 is refused (50 in stock), 50 is accepted, and 0 and -1 are rejected. The reserved stock is not oversold. |
| 2.4 | Two addresses and delivery choice | Default address France. Add the Romanian address for the grandmother, with a phone number of `+40 721 345 678`. Choose `standard`, then `express`. Try an empty `postal_code`, and `line2` `Apt 3, 2nd floor` | The default address is pre-selected and only one default is allowed. Switching address changes the order's shipping address. Delivery method is stored. Missing required fields are flagged. Diacritics (`București`) are kept in the order and emails. Check shipping: with one `Anker 65W GaN Charger White` (39.99) the total is 39.99 for `standard` and 49.98 for `express`, and the tax is 1.90 in both cases. |
| 2.5 | Payment fails, then she retries | Gift: `Samsung Bluetooth Headphones White` (99.99, tax 4.76). Pay with `4000 0000 0000 0002` (declined), then with `4242 4242 4242 4242` | A clear failure message and the cart is kept. Stock is released after the failed payment and not taken twice. Retry creates no duplicate order. The order moves from `payment_failed` to `paid` if it is the same order. |

---

## Persona 3: Alex Kovacs, tech-savvy bargain hunter

| Attribute | Value |
|---|---|
| Age and birthdate | 27, `1999-09-18` |
| Location | `Bulevardul Unirii 18, Cluj-Napoca, 400098, RO` |
| Contact | `alex.kovacs@smartphone-shop.test`, `+40 744 112 244` |
| Device | Desktop with Firefox and DevTools, a phone, several tabs, price-comparison extensions, sometimes a VPN |
| Tech skills | Reads network requests, edits URLs and API calls, uses the API directly, compares prices on other sites |
| Goal | Find the cheapest phone and accessories, and stack every discount he can |
| Frustrations | Hidden fees, price changes at checkout, coupons that don't apply |
| Priorities to test | Sorting and filtering, coupons, price integrity, concurrency, security |

| # | Scenario | Test data | Explore and watch for |
|---|---|---|---|
| 3.1 | Sort and filter for the cheapest phone | Category `smartphone`, sort by price ascending, available only. Expected order among available phones: `Xiaomi Redmi Note 13 128GB` 249.99, `OnePlus Nord 3 128GB` 449.99, `Motorola Edge 40 128GB` 549.99, `OnePlus Nord 3 512GB` 649.99. Unavailable and cheaper: `Xiaomi Redmi Note 13 256GB` 299.99. Also sort by rating: `Vivo X100 512GB` has rating `0.0` | The unavailable phone is hidden or marked when filtering. Prices are tax-inclusive everywhere. Sort order is stable for equal prices (for example ties at 899.99 for three phones and at 999.99 for two). Unrated products (rating 0.0) don't appear as "worst rated". Price range filters accept `0`, `250`, `250.00`, `abc`, and a minimum above the maximum. |
| 3.2 | Coupon `BF2026` (20% off) outside, inside and beyond its rules | Cart: 2 × `Anker 65W GaN Charger White` (39.99) and 1 × `Baseus 65W GaN Charger White` (29.99). Subtotal 109.97 (79.98 + 29.99), tax 5.24. Expected with `BF2026` inside the period: discount 8.00 (Anker, 1 unit) + 6.00 (Baseus, 1 unit) = 14.00, `tax_total` stays 5.24, shipping 0.00, total 95.97. Try `BF2026`, `bf2026`, `BF 2026`, `SAVE10`, and `BF2026` twice. The promotion runs from 2026-11-27 00:00 to 2026-11-30 23:59, so today (2026-10-22) is outside it | Before the period the coupon is refused with a clear message and the total stays 109.97. Inside the period only one unit per product is discounted (the Anker line: 1 unit, not 2), the discount is taken from the tax-inclusive price and the tax is not recalculated. Case and spacing variants behave the same. The same coupon can't be stacked twice. Discounts at the exact start and end times. |
| 3.3 | Tamper with prices in the requests | Add `Anker 65W GaN Charger White` to the cart. In DevTools change the request: `price` `39.99` to `0.01`, `quantity` `1` to `-1`, `discount` to `100`, and the user ID to Anna Petrova's `3f6c1a52-8b1e-4d3a-9c47-1a2b3c4d5e01`. Replay `GET /orders/{orderId}` with her order ID | The server recalculates the price and ignores client values. Invalid quantities return 422. Another user's resource returns 404, as the API specification states. Totals never change because of edited requests. No sensitive data appears in error messages. |
| 3.4 | Last unit race condition | First set stock: `UPDATE stock_levels SET quantity_on_hand = 1 WHERE product_id = (SELECT id FROM products WHERE name = 'Anker 65W GaN Charger White');`. Then check out from two browsers at the same moment as `alex.kovacs@smartphone-shop.test` and as a second account | Exactly one order succeeds and the other gets a clear out-of-stock message. Stock never goes below 0 and `quantity_reserved` never exceeds `quantity_on_hand`. A cart left unpaid releases its reservation. |
| 3.5 | Price checks and rounding in the cart | Cart: `McDodo Braided USB-C Cable 1.5m Black` 7.99 × 3, `HOCO USB-C to USB-C Cable 1m Blue` 6.99 × 3, `Techsuit Anti-Glare Film for Galaxy S24` (7.99, unavailable). Expected: 23.97 + 20.97 = 44.94, tax per line 1.14 + 1.00 = 2.14, total 44.94 with `standard` and 54.93 with `express` | Line totals, subtotal, tax and total match to the cent. Tax is rounded per line, so check that the whole-order value (44.94 × 5 / 105 = 2.14) agrees. The same numbers show on the cart, checkout, confirmation email and order history. The unavailable item is blocked. Adding the same item 100 times quickly doesn't break the limit or rate-limit rules. |

---

## Notes

- Scenario 3.4 changes the database, so run it only on a test environment.
- Open questions: the exact payment test cards in your environment, and whether shipping to non-EU or non-UK countries costs more than the flat rates above.
- The arithmetic in this file was recalculated and checked. Nothing has been run against a live system, so expected behaviour is based on the schema, seed data, API specification and the pricing rules above.
