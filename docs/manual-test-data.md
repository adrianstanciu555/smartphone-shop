
# AI-Generated Test Data for Manual Testing

  

## 1. Feature Test Data Matrix

- Feature tested: **User registration** (`POST /auth/register`), covering email, password and name. Source: [feature-based-test-data-matrix.md](./feature-based-test-data-matrix.md)

- Test cases summary (coverage achieved): 15 test cases (TC-01 to TC-15), 8 high, 6 medium and 1 low priority.

| Category | Test cases | What is covered |
|---|---|---|
| Positive | TC-01, TC-02 | Valid registration (`Str0ng!Pass1`), name with diacritics |
| Validation | TC-03 to TC-07 | Duplicate email (exact and different case), invalid email, missing fields, short password, password missing one character class |
| Boundary | TC-08 to TC-11 | Password 8 and 128 characters, name 100, email 254 (and one over each limit) |
| Special | TC-12 to TC-15 | SQL injection and XSS, spaces and plus-tag in email, concurrent registration, verification email and token expiry |

  

- Most valuable test scenarios identified:
  - TC-03: duplicate email `elena.markovic@gmail.com` and `ELENA.Markovic@Gmail.com` must both return 409 (`citext`).
  - TC-07: password missing uppercase, lowercase, digit or special character must return 422 for each.
  - TC-08 and TC-09: password at exactly 8 and 128 characters.
  - TC-12: `Robert'); DROP TABLE users;--` and `<script>alert(1)</script>` as the name.
  - TC-14: two simultaneous registrations for the same email give one 201 and one 409.

- Screenshot or table of the matrix: the full table (ID, category, scenario, test data, expected behavior, priority) is in [feature-based-test-data-matrix.md](./feature-based-test-data-matrix.md). Example rows:

| ID | Category | Test data | Expected behavior | Priority |
|---|---|---|---|---|
| TC-01 | Positive | `new.user@gmail.com`, `Str0ng!Pass1`, `Ioana Radu` | 201, role `customer`, status `unverified`, verification email sent | High |
| TC-06 | Validation | `Ab1!xyz` (7 characters, all classes) | 422, password-length error | High |
| TC-09 | Boundary | 128-character password with all classes | 201 (129 characters returns 422) | Medium |

  

## 2. Test Data Cheat Sheet

- Field types covered: email, phone, name, date, price, address, user ID, password, country and rating (valid, invalid and tricky values for each). Source: [test-data-cheat-sheet.md](./test-data-cheat-sheet.md)

- Most useful test values discovered:

| Field | Values worth keeping |
|---|---|
| Email | 254 and 255 characters, `ELENA.MARKOVIC@GMAIL.COM` (duplicate by case), ` user@test.com ` |
| Password | `Str0ng!Pass1`, `Ab1!xyz9` (8), `Ab1!xyz` (7), and one value missing each character class |
| Price | `0.00`, `99999999.99`, `100000000.00`, `19.999` (rounds to 20.00), `17.99 × 2` |
| Rating | `0.0`, `5.0`, `5.1`, `4.55` (rounds to 4.6), `10.0` (overflow) |
| Tax | `tax_rate` 0 and 5 valid, `5.01` and `-0.01` rejected. `tax_total = sum(round(line_total × 5 / 105, 2))`, for example 837.97 EUR includes 39.90 EUR tax |
| Country and date | `GB` valid, `UK` and `ro` tricky, `2000-02-29` valid, `1900-02-29` invalid |
| Address | Postal code `030167` (leading zero), a second default address (blocked by `uq_addresses_default`) |

- How this improves test efficiency: each field type has ready-made valid, invalid and edge values taken from the schema limits, so testers don't invent data per session. The values are tied to real seed data (`users.sql`, `products.sql`, the customer CSVs), tax and totals are pre-calculated and cross-checked, and the notes mark which rules the database enforces and which must be tested at API level (phone, postal code, country validity, password complexity).

  

## 3. Exploratory Testing Data

- Personas created (source: [exploratory-testing-data-kit.md](./exploratory-testing-data-kit.md)):
  - **Margaret Hughes**, 75, senior with limited tech experience (slow laptop, zoomed to 200%, double-clicks).
  - **Dana Moreau**, 38, busy parent (phone and laptop, several addresses, interrupted sessions).
  - **Alex Kovacs**, 27, tech-savvy bargain hunter (DevTools, coupons, sorting, concurrency).

- Scenarios developed (15 in total, 5 per persona):

| Persona | Scenarios (test data) |
|---|---|
| Margaret | 1.1 register after typos; 1.2 search `samsng galxy` and the unavailable `Samsung Galaxy S24 128GB`; 1.3 double-click Pay on `Apple iPhone 15 256GB` + `Spigen Slim Case for iPhone 15` (total 1119.98, tax 53.33); 1.4 password reset; 1.5 return on day 29 versus day 31 |
| Dana | 2.1 family cart (553.94, tax 26.38); 2.2 cart across devices and session timeout; 2.3 unavailable item and quantities 51, 50, 0, -1; 2.4 two addresses, standard versus express (44.98 versus 49.98); 2.5 declined card `4000 0000 0000 0002` then retry |
| Alex | 3.1 sort and filter smartphones (249.99, 449.99, 549.99, 649.99); 3.2 `BF2026` (109.97 minus 14.00 gives 95.97, tax stays 5.24); 3.3 tampered price, quantity and user ID; 3.4 last-unit race on `Anker 65W GaN Charger White`; 3.5 rounding in a cable cart (44.94, tax 2.14) |

  

- Insights gained from persona-based testing (expected focus areas, not yet run on a live system):
  - Margaret: error messages must say which password rule failed; double-click on Pay must create one order; the 30-day return window must be enforced at day 29 and 31.
  - Dana: carts must survive login and session expiry, stock limits (50 per available product) must be enforced, and totals must agree in cart, checkout and email.
  - Alex: the server must recalculate prices and ignore edited requests, another user's order must return 404, and the last unit must be sold only once.

  

## 4. Testing Insights

- Potential bugs or issues identified (found by reviewing the schema, seeds and API specification; none confirmed by running the application):

| # | Issue | Where | Status |
|---|---|---|---|
| 1 | Password complexity was not in the API contract (length only), and password reset accepted any 8-character password | `openapi.yaml` | Fixed: pattern added to `password` and `newPassword` |
| 2 | `tax_rate` had no upper limit, and `order_items.tax_rate` had no check at all | `schema.sql` | Fixed: `CHECK (tax_rate BETWEEN 0 AND 5)` on both tables |
| 3 | Seed orders had `tax_total = 0` and products had no tax rate, so tax was never exercised | `customer_data_original.sql`, `products.sql` | Fixed: 5% on products, `tax_total` computed, CSVs updated and verified (20 of 20 orders match) |
| 4 | Rules for tax derivation, rounding, coupons and shipping were undefined | schema and docs | Decided: tax included in price, rounded per line, coupons after tax, standard shipping free from 50.00 and 4.99 below it, express 9.99. Confirmed by the team |
| 5 | Phone, postal code and country have no database check (`text` and `char(2)`), so bad values such as `UK`, `XX` or `abc123` can be stored unless the API validates them | `schema.sql` | Open: test at API level |
| 6 | `RegisterRequest` has no consent fields, although `user_consents` (terms, privacy) exists | `openapi.yaml` | Open: confirm where consent is collected |
| 7 | Duplicate-email response (409) reveals which emails are registered | `openapi.yaml` | Open: decide on a neutral response |
| 8 | Products with rating `0.0` (for example `Vivo X100 512GB`) can't be told apart from unrated products | `products-seed.csv` | Open: affects sort and filter by rating |
| 9 | Stock for available products is a placeholder of 50, so quantity-limit tests depend on this value | `products.sql` | Noted |

- How AI-generated test data improved test coverage:
  - Registration went from the three documented fields to 15 cases across positive, validation, boundary and special categories, with every limit tested on both sides (7 and 8, 128 and 129, 100 and 101, 254 and 255).
  - Ten field types got valid, invalid and tricky values, and the review of those values exposed the gaps in issues 1 to 5 above.
  - Three personas added 15 realistic end-to-end scenarios (accessibility, interrupted sessions, concurrency, tampering) that scripted cases rarely cover.
  - Test data is consistent across files: the same tax, totals and product prices appear in the schema, seeds, both CSVs and the guides.

- Challenges faced and solutions found:
  - **Undefined business rules** (password complexity, tax, coupons, shipping): I asked for decisions, documented them in each file and in `schema.sql`, and the team confirmed them. The remaining open points are listed in the issues table.
  - **Totals out of step between files:** every order was recomputed with a script and checked in both CSVs against the same formula.
  - **Rules the database doesn't enforce:** these are marked in the cheat sheet so they are tested through the API.
  - **No live system:** nothing has been run yet, so all expected results come from the specification and seed data. The next step is to run the matrix and scenarios and record actual results.
