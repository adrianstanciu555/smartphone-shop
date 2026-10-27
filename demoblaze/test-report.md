# Demoblaze Checkout Flow – Test Report

- **Site:** https://www.demoblaze.com
- **Date:** 2026-10-27
- **Tool:** Playwright MCP Server
- **Overall result:** PASS (1 observation)

## Steps

| # | Step | Expected | Actual | Result | Screenshot |
|---|------|----------|--------|--------|------------|
| 1 | Navigate to site | Home page loads (title "STORE") | Loaded | PASS | [01-home.png](./01-home.png) |
| 2 | Click "Laptops" category | Laptop list shown | MacBook Pro listed | PASS | [02-laptops.png](./02-laptops.png) |
| 3 | Select "MacBook Pro" | Product page opens | `prod.html?idp_=15` opened | PASS | [03-product.png](./03-product.png) |
| 4 | Click "Add to cart" | Alert "Product added" | Alert "Product added" shown and accepted | PASS | – |
| 5 | Open cart | MacBook Pro in cart | MacBook Pro listed | PASS | [04-cart.png](./04-cart.png) |
| 6 | Place Order, fill form | Form accepts data | Filled: John Test / Test Country / Test City / 4111111111111111 / 12 / 2025 | PASS | [05-order-form.png](./05-order-form.png) |
| 7 | Click "Purchase" | Order completes | Confirmation modal shown | PASS | [06-confirmation.png](./06-confirmation.png) |
| 8 | Verify success message | "Thank you for your purchase!" with order details | See below | PASS | [06-confirmation.png](./06-confirmation.png) |
| 9 | Click OK, close browser | Redirect to home; browser closed | Redirected to `index.html`; browser closed | PASS | – |

## Confirmation modal content

```
Thank you for your purchase!
Id: 4604862
Amount: 1100 USD
Card Number: 4111111111111111
Name: John Test
Date: 27/9/2026
```

## Verifications

- Success message "Thank you for your purchase!" displayed: PASS
- Order ID generated (4604862): PASS
- Amount 1100 USD: PASS
- Name and card number match input: PASS

## Observations

- The confirmation date shows `27/9/2026` while the test ran on 27 Oct 2026. The site appears to display a zero-based month (off by one). This is a defect in the application, not in the test.
- The card expiry (12/2025) is in the past, yet the order was accepted. The site does not validate card data.
