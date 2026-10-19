## - System Instruction:
You are a QA expert focused on elevating the quality of software bug reports. Your task is to review a submitted bug report and enhance each provided section for maximum clarity, completeness, and developer usability, following industry best practices.

### - Goal:
Transform a raw or suboptimal bug report into a clear, actionable, and professional report that accelerates resolution and reduces back-and-forth between QA and development.

### - Input:
A bug report that may include any of the following elements:

- Summary (Title)

- Description

- Steps to Reproduce

- Actual Result

- Expected Result

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version)

### - Procedure:
1. Review all provided elements.

2. For each provided element:

- Identify if it is vague, incomplete, or ambiguous.

- Rewrite it to be precise, detailed, and actionable, using professional language and best practices.

3. **Do not invent or fill in missing sections.** Instead, list any missing sections at the end.

4. At the end, if any required elements are missing, prompt:

- “The following sections are missing: {Summary, Steps, etc.}. Should they be added?”

- If all sections are present, prompt: “Would you like to review or improve anything else?”

### - Enhancement Guidelines:
- **Summary**: Concise, specific, and action-oriented. Clearly state the affected area and the nature of the problem. Avoid generic terms like "bug" or "issue".

- **Description**: Provide context, including where and when the problem occurs, affected user roles, and any relevant conditions or triggers.

- **Steps to Reproduce**: Numbered, imperative, and detailed. Include all necessary data, setup, and environment details for reproducibility.

- **Actual Result**: Clearly describe the observed behavior, including error messages, UI anomalies, or logs if referenced.

- **Expected Result**: Clearly state the correct or intended behavior.

- **Notes / Metadata**: Include relevant logs, environment details, browser/device/version info, and any other supporting data in a structured format.

### - Output Format:
Return the improved bug report in a Markdown code block, using the following structure:

- **Title**

- **Description** (if provided)

- **Steps to Reproduce** (if provided)

- **Actual Result** (if provided)

- **Expected Result** (if provided)

- **Notes/Evidence/Logs** (if provided)

- **Prompt at the end**:

- If any sections are missing: “The following sections are missing: [...]. Should they be added?”

- If all sections are present: “Would you like to review or improve anything else?”

### - Quality Checklist:
✅ Summary is concise, specific, and actionable

✅ Description provides clear context and conditions

✅ Steps are complete, reproducible, and unambiguous

✅ Actual and Expected results are clearly contrasted

✅ Metadata is structured and relevant

✅ Language is professional, precise, and developer-friendly

### - Revision Loop:
If any section remains unclear or incomplete, revise until all content meets high-quality reporting standards.

---

## Examples: Bug reports for STORY-1347 and the cart

```text
Bug example 4:

- Summary (Title): [BUG-004] - Coupon "BF2026" discounts both units when the cart has 2 units of the same product

- Description: During the Black Friday campaign, a registered user adds 2 units of the same product to the cart and applies "BF2026" at Checkout. The 20% discount is applied to both units, but the discount must be applied to 1 unit only (STORY-1347, AC2).

- Steps to Reproduce:

1. Log in as user_ID=5456 (registered user) when the shop time is 2026-11-28 12:00 (Europe/Bucharest)

2. Add 2 units of "Samsung Galaxy S26 Ultra 512GB" (price 1000.00 each) to the cart

3. Go to the Checkout page

4. Enter the coupon code "BF2026" and click Apply

5. Check the discount line and the order total

- Actual Result: The 20% discount is applied to both units. The discount is 400.00 and the order total is 1600.00.

- Expected Result: The 20% discount is applied to 1 unit only. The discount is 200.00, the second unit has the full price 1000.00, and the order total is 1800.00.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 5456, product_ID 101, Windows 11, Chrome latest version
error log: bf2026-qty2-8837451.JSON


Bug example 5:

- Summary (Title): [BUG-005] - Coupon "BF2026" is applied by the coupon API without a valid login token

- Description: Only registered, logged-in users can use the coupon. A request to apply "BF2026" sent without an Authorization header (or with an expired token) returns a discount instead of being rejected.

- Steps to Reproduce:

1. Log in as user_ID=5456 (registered user) when the shop time is 2026-11-28 12:00 (Europe/Bucharest), add 1 unit of any smartphone to the cart and open the Checkout page

2. Log out in another tab (or wait until the access token expires)

3. Back in the Checkout tab, enter the coupon code "BF2026" and click Apply, or send POST /api/checkout/coupon with the old cart ID and no Authorization header

- Actual Result: The response is 200 and the 20% discount is returned and applied to the cart.

- Expected Result: The response is 401, the user is asked to log in, and no discount is applied.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 5456, Windows 11, Firefox latest version
error log: bf2026-noauth-2294810.JSON


Bug example 6:

- Summary (Title): [BUG-006] - Coupon "BF2026" is accepted on 2026-12-01 00:00:00 after the Black Friday promotion ended

- Description: The promotion period is 2026-11-27 00:00:00 to 2026-11-30 23:59:59 (Europe/Bucharest). A registered user can still apply "BF2026" at the exact time the promotion ends, and receives the 20% discount.

- Steps to Reproduce:

1. In the test environment, set the server time to 2026-12-01 00:00:00 (Europe/Bucharest)

2. Log in as user_ID=7001 (registered user)

3. Add 1 unit of any accessory to the cart and open the Checkout page

4. Enter the coupon code "BF2026" and click Apply

- Actual Result: The coupon is accepted and the 20% discount is applied to the unit.

- Expected Result: The coupon is rejected and no discount is applied, because the promotion period has ended.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 7001, test environment, Windows 11, Chrome latest version
The issue could be a UTC/local time conversion (Europe/Bucharest is UTC+2 in November).
error log: bf2026-period-5561230.JSON


Bug example 7:

- Summary (Title): [BUG-007] - Redemption record for "BF2026" is not stored after a successful order

- Description: A registered user completes an order with "BF2026" applied and receives the discount, but no redemption record is created. As a result, the same user can use the coupon again for the same product (STORY-1347, AC4).

- Steps to Reproduce:

1. Log in as user_ID=5456 (registered user) when the shop time is 2026-11-28 12:00 (Europe/Bucharest)

2. Add 1 unit of "Samsung Galaxy S26 Ultra 512GB" to the cart and open the Checkout page

3. Apply the coupon code "BF2026" and complete the payment

4. Verify that the order is confirmed with the discounted price

5. Check the redemption records for user_ID 5456 in the database

6. Add the same product to the cart again and apply "BF2026"

- Actual Result: The order is confirmed with the 20% discount, but no redemption record exists for user_ID 5456. The coupon is accepted again in step 6.

- Expected Result: A redemption record is stored with coupon code "BF2026", user_ID 5456, product_ID 101, quantity discounted = 1, discount amount 200.00, and a UTC timestamp. The coupon is rejected in step 6.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 5456, order ID 90125, Windows 11, Chrome latest version
error log: bf2026-redemption-7712094.JSON


Bug example 8:

- Summary (Title): [BUG-008] - Cart total is not updated after changing the product quantity on the Cart page

- Description: On the Cart page, when the user changes the quantity of a product, the line total and the cart total keep the old values. The correct amount is shown only after refreshing the page.

- Steps to Reproduce:

1. Log in as any registered user

2. Add 1 unit of an iPhone (price 1000.00) to the cart

3. Go to the Cart page

4. Change the quantity from 1 to 3 using the quantity field

- Actual Result: The quantity shows 3, but the line total and the cart total stay at 1000.00 until the page is refreshed.

- Expected Result: The line total and the cart total are updated immediately to 3000.00 without refreshing the page.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Any logged in user or user ID 547, Windows 11, Chrome latest version
error log: cart-qty-3300145.JSON


Bug example 9:

- Summary (Title): [BUG-009] - Two customers can buy the last unit of a product at the same time (overselling)

- Description: A product has 1 unit left in stock. Two different registered customers pay for it at the same time. Both orders are confirmed and the stock becomes -1, although the stock must be reserved at checkout and an out-of-stock product cannot be purchased.

- Steps to Reproduce:

1. Prepare a product with stock = 1 (e.g., "Anker 20W USB-C Charger", product_ID 2045) in Staging

2. Log in as Customer A in Chrome and Customer B in Firefox (two different user IDs)

3. Add 1 unit of the product to the cart in both sessions

4. In both sessions open the Checkout page and select the delivery address and delivery method

5. Pay at the same time in both sessions with a Stripe test card (4242 4242 4242 4242)

6. Check the order status for both customers and the stock in the Admin Back Office

- Actual Result: Both orders are in status "Paid" and both customers receive the confirmation email. The stock of the product is -1.

- Expected Result: Only one order is completed. The second customer gets an out-of-stock message, is not charged, and the stock stays 0.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Customer A user ID 1204, Customer B user ID 1377, product_ID 2045, Staging, Windows 11, Chrome and Firefox latest versions
error log: stock-reserve-4478120.JSON


Bug example 10:

- Summary (Title): [BUG-010] - Order stays in "Pending" after a successful Stripe payment

- Description: A customer pays with a valid test card and the Stripe payment is successful, but the order status in the shop is not updated to "Paid". The customer does not receive the order confirmation email and the stock is not deducted. The payment webhook seems to be missed.

- Steps to Reproduce:

1. Log in as an existing customer (user ID 912) in Staging

2. Add 1 smartphone to the cart and open the Checkout page

3. Select the delivery address and delivery method

4. Pay with the Stripe test card 4242 4242 4242 4242

5. Wait for the confirmation page and check the order in "My orders"

6. Check the payment in the Stripe dashboard

- Actual Result: The Stripe dashboard shows the payment as "Succeeded", but the order stays in "Pending". No confirmation email is sent and the stock is not deducted.

- Expected Result: The order status changes to "Paid" after the payment webhook, the confirmation email is sent, and the stock is deducted.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 912, order ID 90312, Stripe payment intent pi_test_3Nk82, Staging, Windows 11, Chrome latest version
The webhook call is visible in the Stripe dashboard with the response 504 (timeout).
error log: webhook-timeout-6619034.JSON


Bug example 11:

- Summary (Title): [BUG-011] - Double click on "Pay now" creates two orders and charges the customer twice

- Description: On the Checkout page, a double click on the "Pay now" button submits the payment twice. The customer sees two orders in the order history and two charges in Stripe for the same cart.

- Steps to Reproduce:

1. Log in as an existing customer (user ID 912)

2. Add 1 smartphone to the cart and open the Checkout page

3. Select the delivery address and delivery method and enter the Stripe test card 4242 4242 4242 4242

4. Double-click quickly on the "Pay now" button

5. Open "My orders" and check the payments in the Stripe dashboard

- Actual Result: Two orders with different order IDs (90350 and 90351) are created, and Stripe shows two successful payments of the same amount.

- Expected Result: Only one order is created and the customer is charged once. The "Pay now" button is disabled after the first click.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 912, Staging, Windows 11, Chrome latest version
error log: duplicate-order-5501876.JSON


Bug example 12:

- Summary (Title): [BUG-012] - Phone case filter "Compatible with iPhone 16" shows cases for Samsung Galaxy S26 and out-of-stock products

- Description: On the Products page, in the Cases category, filtering by compatibility returns products that are not compatible with the selected phone and also products that are out of stock.

- Steps to Reproduce:

1. Open the Products page as a visitor (no account)

2. Select the category "Phone cases"

3. Filter by Compatibility = "Apple iPhone 16"

4. Review the products in the filtered list

- Actual Result: The list contains 3 cases made for "Samsung Galaxy S26" and 2 products with the label "Out of stock".

- Expected Result: Only cases compatible with the Apple iPhone 16 are displayed. Out-of-stock products are either hidden or clearly marked as not available for purchase, according to the catalog rules.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Visitor (no account), Staging, Windows 11, Firefox latest version
Examples: product_ID 3120, 3121, 3122 (Samsung), product_ID 3201, 3202 (out of stock)
error log: filter-compat-7720341.JSON


Bug example 13:

- Summary (Title): [BUG-013] - Customer can open another customer's order details by changing the order ID in the URL

- Description: A logged-in customer can see the order details (name, address, phone, items) of another customer by changing the order ID in the order details URL. Customers must access only their own data.

- Steps to Reproduce:

1. Log in as Customer A (user ID 912) and open the order details of order 90312 (the URL contains /orders/90312)

2. Log out and log in as Customer B (user ID 1377), who is a different customer

3. Open the URL /orders/90312 in the browser

- Actual Result: Customer B can see the full details of order 90312 that belongs to Customer A, including the delivery address and the phone number.

- Expected Result: Customer B gets a "403 Forbidden" (or "404 Not Found") response and no data of Customer A is displayed.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Customer A user ID 912, Customer B user ID 1377, order ID 90312, Staging, Windows 11, Chrome latest version
Security impact: broken access control (IDOR), with a GDPR risk for personal data.
The same request through the API (GET /api/orders/90312 with Customer B's token) returns 200.
error log: idor-order-8830012.JSON


Bug example 14:

- Summary (Title): [BUG-014] - Stock is not released after a failed payment, so the product shows as out of stock

- Description: When a customer's card is declined at Checkout, the reserved unit is not released back to the stock. The product with 1 unit left stays unavailable for other customers, although no order was paid.

- Steps to Reproduce:

1. Prepare a product with stock = 1 (e.g., "Spigen Ultra Hybrid Case", product_ID 3050) in Staging

2. Log in as Customer A (user ID 1204), add 1 unit to the cart and open the Checkout page

3. Select the delivery address and delivery method

4. Pay with the Stripe declined test card 4000 0000 0000 0002

5. Wait 15 minutes (the stock reservation timeout) and check the stock in the Admin Back Office

6. Log in as Customer B (user ID 1377) and open the product page

- Actual Result: The payment is declined, but the stock of the product stays 0 in the Admin Back Office. Customer B sees "Out of stock" and cannot add the product to the cart.

- Expected Result: The reservation is released after the failed payment (or at the latest after the timeout), the stock returns to 1, and Customer B can buy the product.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Customer A user ID 1204, Customer B user ID 1377, product_ID 3050, Staging, Windows 11, Chrome latest version
error log: stock-release-4410982.JSON


Bug example 15:

- Summary (Title): [BUG-015] - Return request is accepted 31 days after delivery

- Description: Returns are allowed within 30 days of delivery. A customer with an order delivered 31 days ago can still create a return request and receive the return label.

- Steps to Reproduce:

1. Log in as the test customer "Customer (return window)" (user ID 2210) in Staging

2. Open "My orders" and select the order delivered 31 days ago (order ID 88140)

3. Click "Return items" and select 1 item

4. Select the return reason "Changed my mind" and submit the request

- Actual Result: The return request is created with the status "Approved" and the return label is displayed.

- Expected Result: The "Return items" button is disabled (or the request is rejected) with the message that the 30-day return period has expired.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 2210, order ID 88140 (delivered 31 days ago), order ID 88139 (delivered 29 days ago, works as expected), Staging, Windows 11, Chrome latest version
The issue could be a UTC/local date conversion or an off-by-one error in the date comparison.
error log: return-window-3329051.JSON


Bug example 16:

- Summary (Title): [BUG-016] - Valid delivery address with Romanian diacritics is rejected on the Checkout page

- Description: When a customer adds a delivery address that contains valid special characters (ă, â, î, ș, ț), the form shows a validation error and the address cannot be saved. The customer cannot continue to payment.

- Steps to Reproduce:

1. Log in as a new customer (user ID 2301) in Staging

2. Add 1 smartphone to the cart and open the Checkout page

3. Click "Add new address" and enter: Name "Ștefan Țurcanu", Street "Șoseaua Pantelimon 245", City "București", Postal code "021591", Phone "+40 721 234 567"

4. Click "Save address"

- Actual Result: The error "Invalid characters in the Street field" is displayed and the address is not saved. The same address written without diacritics ("Soseaua Pantelimon 245") is accepted.

- Expected Result: The address with diacritics is accepted and saved, and the customer can continue to select the delivery method.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 2301, Staging, Windows 11, Chrome latest version
Reproduced also with the City "Iași" and the name "Mărgărit".
error log: address-validation-5518830.JSON


Bug example 17:

- Summary (Title): [BUG-017] - Order is created with a modified product price sent from the client

- Description: The price must be confirmed server-side at checkout. When the price in the checkout request is changed with browser DevTools, the order is accepted and paid with the modified price.

- Steps to Reproduce:

1. Log in as a customer (user ID 912) in Staging

2. Add 1 unit of "Samsung Galaxy S26 Ultra 512GB" (price 1000.00) to the cart and open the Checkout page

3. Open the browser DevTools (Network tab) and enable request interception for POST /api/checkout

4. Click "Pay now" and change the "unitPrice" value in the request body from 1000.00 to 1.00

5. Send the modified request and check the order total

- Actual Result: The request is accepted with the response 201. The order is created with the total 1.00 and the Stripe payment is charged 1.00.

- Expected Result: The server ignores the price from the client, calculates the total from the catalog price (1000.00), or rejects the request with the response 400.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 912, order ID 90420, Staging, Windows 11, Chrome latest version
Security impact: price tampering (OWASP A04 Insecure Design) with direct financial loss.
error log: price-tamper-6640127.JSON


Bug example 18:

- Summary (Title): [BUG-018] - Account is not locked after 5 failed login attempts

- Description: The security policy requires rate limiting and an account lockout on login. A customer account can be used for an unlimited number of wrong password attempts, which allows brute-force attacks.

- Steps to Reproduce:

1. Open the Login page in Staging

2. Enter the email of the customer user ID 912 and a wrong password

3. Repeat step 2 for 20 times, one after another

4. Enter the correct password

- Actual Result: Each attempt shows "Wrong email or password". After 20 attempts the account is not locked, no rate limit message (429) is shown, and the login with the correct password is successful.

- Expected Result: After 5 failed attempts the account is locked (or the attempts are rate limited), a lockout message is displayed, and the login with the correct password is rejected until the lockout expires or the account is unlocked.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 912, Staging, Windows 11, Chrome latest version
The same behavior through the API: POST /api/auth/login returns 401 for each attempt and never 429.
error log: login-lockout-7781205.JSON


Bug example 19:

- Summary (Title): [BUG-019] - Customer with an unverified email can complete the checkout

- Description: A newly registered customer who did not verify the email address can add products to the cart, pay, and receive an order confirmation. The email verification is required before the customer can buy.

- Steps to Reproduce:

1. Register a new account with the email test.unverified@example.com in Staging and do not open the verification link

2. Log in with the new account

3. Add 1 smartphone to the cart and open the Checkout page

4. Select the delivery address and delivery method and pay with the Stripe test card 4242 4242 4242 4242

- Actual Result: The payment is successful and the order is confirmed, although the account status is "Email not verified".

- Expected Result: The Checkout page blocks the payment and displays a message that the email address must be verified, with a "Resend verification email" option.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 2305 (test.unverified@example.com), order ID 90455, Staging, Windows 11, Chrome latest version
error log: unverified-checkout-4491763.JSON


Bug example 20:

- Summary (Title): [BUG-020] - Order cancelled before shipment is not refunded to the original payment method

- Description: A customer cancels a paid order before it is shipped. The order status changes to "Cancelled", but no refund is created in Stripe and the customer is not notified.

- Steps to Reproduce:

1. Log in as an existing customer (user ID 912) in Staging

2. Place an order with 1 smartphone and pay with the Stripe test card 4242 4242 4242 4242 (order status "Paid")

3. Open "My orders", select the order (order ID 90470) and click "Cancel order" before the shipment is created

4. Confirm the cancellation

5. Check the order status, the Stripe dashboard, and the customer's inbox

- Actual Result: The order status is "Cancelled" and the stock is restored, but the Stripe payment has no refund and the customer receives no refund email.

- Expected Result: The full amount is refunded to the original payment method (Stripe refund created), the order status shows the refund, and the customer receives a cancellation and refund email.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 912, order ID 90470, Stripe payment intent pi_test_8Ht41, Staging, Windows 11, Chrome latest version
error log: cancel-refund-8812046.JSON
```