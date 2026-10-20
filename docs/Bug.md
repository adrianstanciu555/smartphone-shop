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

## Examples: Bug reports

```text
Bug example 1:

- Summary (Title): [BUG-001] - User cannot login after password reset was successfully reset

- Description: User abc123@gmail.com entered 3 times the wrong password.
He tried to reset the password via the forgot password link.
However even if the account password was successfully reset, he still cannot login with the new one.
He sent an email to the Customer Support Team: support@smartphone-shop.com

- Priority: P1
- Severity: High
- Status: Closed
- Component: Password reset and login
- Category: Functional
- Module: User Accounts & Authentication
- Created Date: 2025-10-29
- Closed Date: 2025-11-06
- Root Cause: Likely the failed-attempt counter or temporary lock is not cleared when the password is reset, so the login with the new password is still rejected.
- Tags: Backend, Production issue
- Area Path: SmartphoneShop\Backend\Auth

- Steps to Reproduce:

1. User is at the Login page for our website

2. User abc123@gmail.com enters 3 times a wrong password

3. User clicks the Forgot password link and sets up a new password successfully

4. User enters the newly created password in the Login page

5. Still gets wrong password and cannot login into his account.

- Actual Result: User cannot login into his account with the newly created password.

- Expected Result: User can login successfully into his account with the newly created password.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 378 = abc123@gmail.com, Windows 11, Chrome latest version
error log: etddf123324.JSON


Bug example 2:

- Summary (Title): [BUG-002] - Smartphones are filtered by OS equals Android and displays iOS devices

- Description: On the Products page if you filter the Smartphones by OS = Android you get results for iPhones.

- Priority: P2
- Severity: Medium
- Status: Closed
- Component: Catalog filters (OS)
- Category: Functional
- Module: Product Catalog
- Created Date: 2025-10-29
- Closed Date: 2025-11-03
- Root Cause: Likely the OS filter is not applied in the catalog search query, or the iPhone products have the wrong OS attribute in the catalog data.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Catalog

- Steps to Reproduce:

1. Go to the Products page and filter Smartphones by Operating system = Android

2. In the filtered list there are shown iPhones as well

- Actual Result: On the Products page if you filter Smartphones by OS equals Android, iOS devices are displayed in the list

- Expected Result: On the Products page if you filter Smartphones by OS equals Android, iOS devices are not displayed in the list

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Guest or any User ID, Windows 11, Firefox latest version
error log: abc123485845.JSON


Bug example 3:

- Summary (Title): [BUG-003] - Coupon code "10PERCENTFIRSTORDER" is not working

- Description: For the first order on a newly created account we are giving 10% discount.
However on the Checkout page the already added "10PERCENTFIRSTORDER" coupon doesn't subtract from the total amount (not working).

- Priority: P2
- Severity: High
- Status: Closed
- Component: Coupon calculation
- Category: Functional
- Module: Checkout & Payments
- Created Date: 2025-11-07
- Closed Date: 2025-11-15
- Root Cause: Likely the first-order eligibility check fails (for example it counts the pending or cart order), so the discount is never added to the order total.
- Tags: Backend, Production issue, Migration
- Area Path: SmartphoneShop\Backend\Checkout

- Steps to Reproduce:

1. The User has added a smartphone to the Product cart.

2. Goes to the Checkout page to finish the order.

3. The "10PERCENTFIRSTORDER" coupon code doesn't subtract from the total amount.

- Actual Result: On the Checkout page the "10PERCENTFIRSTORDER" coupon is not working.

- Expected Result: On the Checkout page the "10PERCENTFIRSTORDER" coupon is working, subtracts from the total amount.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Any logged in user or user 547: miket89@gmail.com
Coupon code = "10PERCENTFIRSTORDER"
Windows 11 latest version, Chrome latest version
error log: jhdfdskfjfdk1232432.JSON


Bug example 4:

- Summary (Title): [BUG-004] - Coupon "BF2026" discounts both units when the cart has 2 units of the same product

- Description: During the Black Friday campaign, a registered user adds 2 units of the same product to the cart and applies "BF2026" at Checkout. The 20% discount is applied to both units, but the discount must be applied to 1 unit only (STORY-1347, AC2).

- Priority: P1
- Severity: Critical
- Status: In Progress
- Component: Coupon calculation (BF2026)
- Category: Functional
- Module: Checkout & Payments
- Created Date: 2025-11-19
- Closed Date: -
- Root Cause: Likely the 20% discount is calculated on the line total (price x quantity) instead of 1 unit.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Checkout

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

- Priority: P1
- Severity: Critical
- Status: To Do
- Component: Coupon API, authentication guard
- Category: Security
- Module: Checkout & Payments
- Created Date: 2025-11-22
- Closed Date: -
- Root Cause: Likely the JWT guard is missing on POST /api/checkout/coupon, or the expired token is not validated.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Checkout

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

- Priority: P2
- Severity: High
- Status: To Do
- Component: Coupon validity period (BF2026)
- Category: Functional
- Module: Checkout & Payments
- Created Date: 2025-11-22
- Closed Date: -
- Root Cause: Likely the end of the promotion is compared in UTC instead of Europe/Bucharest, or the end date is inclusive of the next day.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Checkout

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

- Priority: P1
- Severity: High
- Status: In Progress
- Component: Coupon redemption records
- Category: Functional
- Module: Checkout & Payments
- Created Date: 2025-12-02
- Closed Date: -
- Root Cause: Likely the redemption record is not saved in the order confirmation transaction, so the usage limit is never enforced.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Checkout

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

- Priority: P2
- Severity: Medium
- Status: Closed
- Component: Cart totals display
- Category: Functional
- Module: Shopping Cart
- Created Date: 2025-12-24
- Closed Date: 2026-01-04
- Root Cause: The quantity change updated the local state but did not wait for the recalculated totals from the cart API, so the totals were not re-rendered.
- Tags: Frontend, Production issue
- Area Path: SmartphoneShop\Frontend\Customer\Cart

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

- Priority: P1
- Severity: Critical
- Status: In Progress
- Component: Stock reservation
- Category: Concurrency
- Module: Inventory Management
- Created Date: 2025-12-28
- Closed Date: -
- Root Cause: Likely the stock check and the stock decrement are not atomic (no row lock or conditional update in the reservation transaction).
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Inventory

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

- Priority: P1
- Severity: Critical
- Status: In Progress
- Component: Stripe payment webhook handler
- Category: Integration
- Module: Checkout & Payments
- Created Date: 2026-01-04
- Closed Date: -
- Root Cause: Likely the webhook handler runs the order update, stock deduction, and email in one request and exceeds the Stripe timeout (504). The failed event is not retried or reconciled.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Checkout\Webhooks

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

- Priority: P1
- Severity: High
- Status: Ready for QA
- Component: Pay now button, order creation
- Category: Functional
- Module: Checkout & Payments
- Created Date: 2026-02-03
- Closed Date: -
- Root Cause: Likely the button is not disabled after the first click and the checkout request has no idempotency key.
- Tags: Backend, Frontend, Other
- Area Path: SmartphoneShop\Frontend\Customer\Checkout

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

- Priority: P2
- Severity: Medium
- Status: To Do
- Component: Catalog filters (compatibility)
- Category: Functional
- Module: Product Catalog
- Created Date: 2026-02-08
- Closed Date: -
- Root Cause: To be confirmed
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Catalog

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

- Priority: P1
- Severity: Critical
- Status: Ready for QA
- Component: Order details endpoint and page, authorization
- Category: Security
- Module: Order Management & Delivery
- Created Date: 2026-02-27
- Closed Date: -
- Root Cause: Broken access control (IDOR). GET /api/orders/:id likely loads the order by ID only and does not check that the order belongs to the user in the JWT.
- Tags: Backend, Frontend, Other
- Area Path: SmartphoneShop\Backend\Orders

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

- Priority: P1
- Severity: High
- Status: In Progress
- Component: Stock reservation release
- Category: Functional
- Module: Inventory Management
- Created Date: 2026-03-07
- Closed Date: -
- Root Cause: Likely the declined payment event does not trigger the release, and the 15-minute expiry job does not release the reservation.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Inventory

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

- Priority: P2
- Severity: High
- Status: Ready for Release
- Component: Return eligibility check
- Category: Functional
- Module: Order Management & Delivery
- Created Date: 2026-03-25
- Closed Date: -
- Root Cause: Likely an off-by-one error or a UTC/local date conversion in the 30-day comparison.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Orders

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

- Priority: To be prioritised
- Severity: Medium
- Status: To Do
- Component: Delivery address form validation
- Category: Functional
- Module: Checkout & Payments
- Created Date: 2026-04-26
- Closed Date: -
- Root Cause: To be confirmed
- Tags: Backend, Frontend, Other
- Area Path: SmartphoneShop\Backend\Users

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

- Priority: P1
- Severity: Critical
- Status: Ready for Release
- Component: Checkout API, price calculation
- Category: Security
- Module: Checkout & Payments
- Created Date: 2026-05-22
- Closed Date: -
- Root Cause: Likely the backend uses the unitPrice from the request body instead of the catalog price.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Checkout

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

- Priority: P1
- Severity: High
- Status: To Do
- Component: Login rate limiting and account lockout
- Category: Security
- Module: User Accounts & Authentication
- Created Date: 2026-08-21
- Closed Date: -
- Root Cause: Likely the failed-attempt counter and the Redis rate limit are not implemented or not enabled for the login endpoint.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Auth

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

- Priority: P1
- Severity: High
- Status: Ready for QA
- Component: Checkout eligibility check
- Category: Functional
- Module: Checkout & Payments
- Created Date: 2026-08-27
- Closed Date: -
- Root Cause: Likely the checkout does not check the email verification status on the server.
- Tags: Backend, Frontend, Other
- Area Path: SmartphoneShop\Backend\Checkout

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

- Priority: P1
- Severity: Critical
- Status: Blocked
- Component: Order cancellation, Stripe refund
- Category: Integration
- Module: Order Management & Delivery
- Created Date: 2026-08-30
- Closed Date: -
- Root Cause: Likely the cancellation flow does not call the Stripe refund API, or the call fails silently. Retesting is blocked by the unstable Stripe sandbox.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Orders

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


Bug example 21:

- Summary (Title): [BUG-021] - Verification link older than 24 hours still verifies the account

- Description: Registration links are valid for 24 hours (STORY-1351, AC3). A link opened after that time still changes the account status to "Verified".

- Priority: P2
- Severity: Medium
- Status: New
- Component: Email verification link
- Category: Functional
- Module: User Accounts & Authentication
- Created Date: 2026-09-15
- Closed Date: -
- Root Cause: Likely the link expiry is not checked on the server.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Auth

- Steps to Reproduce:

1. Register a new account in Staging with a unique email (user ID 2401)

2. Wait 24 hours and 1 minute, or move the server time forward by that amount

3. Open the verification link from the email

- Actual Result: The account status changes to "Verified" and the user can log in.

- Expected Result: The message "This link has expired" is displayed, the account stays "Unverified", and an option to resend the verification email is offered.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 2401, Staging, Windows 11, Chrome latest version
Possible cause: the link expiry is not checked on the server.


Bug example 22:

- Summary (Title): [BUG-022] - Registration with "John@Example.com" succeeds when "john@example.com" already exists

- Description: Email uniqueness must not be case sensitive (STORY-1351, AC4). A second account is created that differs only by letter case.

- Priority: P2
- Severity: Medium
- Status: New
- Component: Sign up, email uniqueness
- Category: Functional
- Module: User Accounts & Authentication
- Created Date: 2026-09-17
- Closed Date: -
- Root Cause: Likely the unique constraint on the email column is case sensitive.
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Auth

- Steps to Reproduce:

1. Register an account with "john@example.com" in Staging

2. Log out and open the Sign up page

3. Enter "John@Example.com" with valid data and a valid password, accept the Terms and Privacy Policy, and submit

- Actual Result: A second account is created and a verification email is sent. Both accounts exist in the database.

- Expected Result: The registration is rejected with the generic message "Unable to register with this email", and no second account is created.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Staging, Windows 11, Firefox latest version
Possible cause: the unique constraint on the email column is case sensitive.


Bug example 23:

- Summary (Title): [BUG-023] - Cancelling an order does not return the units to the available stock

- Description: When a customer cancels a paid order before shipment, the refund works, but the units are not added back to the stock (STORY-1354, AC2).

- Priority: P2
- Severity: High
- Status: New
- Component: Order cancellation, stock release
- Category: Functional
- Module: Inventory Management
- Created Date: 2026-09-21
- Closed Date: -
- Root Cause: To be confirmed
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Inventory

- Steps to Reproduce:

1. Prepare a product with stock = 5 (e.g., "Anker 20W USB-C Charger", product_ID 2045) in Staging

2. Log in as an existing customer (user ID 912), buy 2 units, and wait until the order status is "Paid" (stock = 3)

3. Open "My orders", select the order, click "Cancel order", and confirm

4. Check the order status and the product stock in the Admin Back Office

- Actual Result: The order status is "Cancelled" and the refund is created, but the stock stays 3.

- Expected Result: The order status is "Cancelled", the refund is created, and the stock returns to 5.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
User ID 912, product_ID 2045, Staging, Windows 11, Chrome latest version


Bug example 24:

- Summary (Title): [BUG-024] - Support agent can change the status of a "Delivered" order back to "Processing"

- Description: Order status transitions are restricted in the back office (STORY-1355, AC3). An invalid transition from "Delivered" to "Processing" is accepted.

- Priority: P2
- Severity: High
- Status: New
- Component: Back office order status transitions
- Category: Functional
- Module: Admin Back Office
- Created Date: 2026-09-28
- Closed Date: -
- Root Cause: Likely the allowed status transitions are not validated on the server (the API also returns 200).
- Tags: Backend, Other
- Area Path: SmartphoneShop\Backend\Admin

- Steps to Reproduce:

1. Log in to the Admin Back Office as a Support Agent in Staging

2. Search for an order in status "Delivered" (e.g., order ID 88140)

3. Open the order and change the status to "Processing"

4. Save the change and reopen the order

- Actual Result: The status is saved as "Processing", and the customer receives a notification that the order is being prepared.

- Expected Result: The system rejects the change and the status remains "Delivered". No notification is sent.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Order ID 88140, Support Agent role, Staging, Windows 11, Chrome latest version
The same request through the API (PATCH /api/admin/orders/88140) also returns 200.


Bug example 25:

- Summary (Title): [BUG-025] - A newly created product is visible in the public catalog before it is published

- Description: A new product must have status "Hidden" until it is published (STORY-1357, AC1). The product appears in the catalog and search results immediately after saving.

- Priority: To be prioritised
- Severity: Medium
- Status: New
- Component: Product creation, product visibility
- Category: Functional
- Module: Admin Back Office
- Created Date: 2026-10-01
- Closed Date: -
- Root Cause: To be confirmed
- Tags: Backend, Frontend, Other
- Area Path: SmartphoneShop\Backend\Catalog

- Steps to Reproduce:

1. Log in to the Admin Back Office as a Catalog Manager in Staging

2. Create a product with all required fields: "Techsuit Clear Case iPhone 17", brand Techsuit, category case, price 19.99 EUR, stock 50, 1 image, description

3. Click "Save" without publishing

4. Open the public catalog as a visitor (no account) and search for "Techsuit Clear Case iPhone 17"

- Actual Result: The product has status "Active" and is listed in the catalog. A visitor can open the product page.

- Expected Result: The product has status "Hidden" and is not shown in the catalog, search results, or by direct URL until it is published.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Catalog Manager and Visitor roles, Staging, Windows 11, Chrome latest version


Bug example 26:

- Summary (Title): [BUG-026] - "Pay now" button is not clickable on the new Checkout page on iPhone Safari

- Description: After the migration to the new design, the "Pay now" button on the Checkout page is covered by the new sticky order summary bar on iPhone Safari. Customers cannot complete the payment on mobile.

- Priority: P1
- Severity: Critical
- Status: In Progress
- Component: Checkout page layout (sticky summary)
- Category: UI
- Module: Checkout & Payments
- Created Date: 2026-10-02
- Closed Date: -
- Root Cause: Likely the new sticky bar uses 100vh and a z-index higher than the button, which does not account for the Safari dynamic toolbar.
- Tags: Frontend, Production issue, Migration
- Area Path: SmartphoneShop\Frontend\Customer\Checkout

- Steps to Reproduce:

1. Open the website in Production on an iPhone 15 (iOS 18, Safari) and log in as a registered customer

2. Add 1 smartphone to the cart and open the Checkout page

3. Select the delivery address and delivery method

4. Scroll to the bottom of the page and tap the "Pay now" button

- Actual Result: The tap is captured by the sticky order summary bar, which only expands and collapses. The "Pay now" button cannot be tapped, and the payment is not started.

- Expected Result: The "Pay now" button is fully visible and clickable on all supported mobile browsers, and the payment is started.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Production, iPhone 15, iOS 18, Safari. Not reproduced on Android Chrome or desktop.
Checkout conversion on iOS Safari dropped after the release 2026.09.1 (see monitoring dashboard).
Sentry: no error. Screen recording: checkout-ios-sticky-9912034.MP4


Bug example 27:

- Summary (Title): [BUG-027] - Old product URLs return 404 after the new design release (SEO traffic loss)

- Description: The new design changed the product URL structure from /product/[id] to /products/[brand]/[slug]-[id]. The old URLs indexed by Google and used in emails and bookmarks return "404 Not Found" instead of redirecting to the new page.

- Priority: P1
- Severity: High
- Status: In Progress
- Component: URL routing and redirects
- Category: Functional
- Module: Product Catalog
- Created Date: 2026-10-05
- Closed Date: -
- Root Cause: Likely the 301 redirect rules from the old routes were not added to the Next.js configuration during the migration.
- Tags: Frontend, Production issue, Migration
- Area Path: SmartphoneShop\Frontend\Public\Product

- Steps to Reproduce:

1. Open the old URL https://www.smartphone-shop.com/product/101 in Production as a visitor

2. Search "Samsung Galaxy S26 Ultra" in Google and open the result that points to the old URL

- Actual Result: The "404 Page not found" page is displayed. Organic traffic to product pages dropped by about 35% in the week after the release.

- Expected Result: The old URL is redirected with a 301 response to the new product page URL, and the product details are displayed.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Production, visitor (no account), Windows 11, Chrome latest version
Product_ID 101. Google Search Console shows "Not found (404)" for 1,240 URLs.
error log: redirect-404-3341876.JSON


Bug example 28:

- Summary (Title): [BUG-028] - Cart items of logged-in customers are empty after the release of the new design

- Description: After the release, some returning customers open the Cart page and see an empty cart, although they added products before the release. The old cart data was not migrated to the new cart format.

- Priority: P1
- Severity: High
- Status: Ready for QA
- Component: Cart data migration
- Category: Data
- Module: Shopping Cart
- Created Date: 2026-10-07
- Closed Date: -
- Root Cause: Likely the Redis cart cache key changed in the new version (cart:{userId} to cart:v2:{userId}), and the old carts were not migrated or read.
- Tags: Backend, Production issue, Migration
- Area Path: SmartphoneShop\Backend\Cart

- Steps to Reproduce:

1. Use a Production customer account (user ID 41872) that had 2 products in the cart before the release 2026.09.1

2. Log in after the release and open the Cart page

3. Check the cart in the database (carts and cart_items tables) for the same user

- Actual Result: The Cart page shows "Your cart is empty". The database still contains 2 cart items for user ID 41872.

- Expected Result: The Cart page shows the 2 products added before the release, with the current price and availability.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Production, user ID 41872, Windows 11, Chrome latest version
Reported by 38 customers to Customer Support (support@smartphone-shop.com).
error log: cart-migration-5528410.JSON


Bug example 29:

- Summary (Title): [BUG-029] - Login session is lost after the release and customers must log in again every few minutes

- Description: After the new frontend release, customers are logged out after about 5 minutes of activity. The new frontend does not use the refresh token to get a new access token.

- Priority: P1
- Severity: High
- Status: Ready for Release
- Component: Token refresh in the API client
- Category: Functional
- Module: User Accounts & Authentication
- Created Date: 2026-10-08
- Closed Date: -
- Root Cause: Likely the new API client does not send the refresh token cookie (missing credentials: "include"), so the refresh request returns 401.
- Tags: Frontend, Production issue, Migration
- Area Path: SmartphoneShop\Frontend\Auth

- Steps to Reproduce:

1. Open the website in Production and log in as a registered customer (user ID 41872) with "Remember me" selected

2. Browse the catalog and add a product to the cart

3. Wait 6 minutes (the access token is valid 5 minutes) and click "Cart"

- Actual Result: The customer is redirected to the Login page with the message "Session expired". The request POST /api/auth/refresh returns 401.

- Expected Result: The access token is refreshed silently with the refresh token, and the customer stays logged in and opens the Cart page.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Production, user ID 41872, Windows 11, Chrome and Firefox latest versions
The refresh request does not contain the cookie in the Network tab.
error log: refresh-401-7765012.JSON


Bug example 30:

- Summary (Title): [BUG-030] - Product images are 4-5 MB each and the Catalog page loads slowly on the new design

- Description: In the new catalog grid, the original product images (4-5 MB) are loaded instead of the optimized thumbnails. The LCP on the catalog page is above the 2.5 s target and the customers on mobile networks leave the page.

- Priority: P2
- Severity: High
- Status: In Progress
- Component: Catalog product grid, image optimization
- Category: Performance
- Module: Product Catalog
- Created Date: 2026-10-09
- Closed Date: -
- Root Cause: Likely the new image component does not use the Next.js image optimization and CloudFront resized variants, so the original files from S3 are loaded.
- Tags: Frontend, Production issue, Migration
- Area Path: SmartphoneShop\Frontend\Public\Catalog

- Steps to Reproduce:

1. Open https://www.smartphone-shop.com/catalog in Production as a visitor on Chrome with the network throttled to "Fast 4G"

2. Open DevTools (Network tab) and reload the page

3. Check the size of the image requests and the LCP in Lighthouse

- Actual Result: The page loads 20 images with a total of 86 MB. The LCP is 7.8 s on mobile (before the release: 2.1 s).

- Expected Result: The page loads optimized images (WebP/AVIF, under 200 KB each), and the LCP is below 2.5 s.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Production, visitor (no account), Windows 11, Chrome latest version, Fast 4G throttling
Lighthouse report: catalog-lcp-2026-10-09.JSON


Bug example 31:

- Summary (Title): [BUG-031] - Order confirmation emails are sent with the old logo, broken links, and without the order total

- Description: After the migration to the new design, the order confirmation emails use the old template. The logo and the "View order" link point to the old paths, and the order total and the delivery address are empty.

- Priority: P2
- Severity: Medium
- Status: To Do
- Component: Order confirmation email template
- Category: Functional
- Module: Order Management & Delivery
- Created Date: 2026-10-12
- Closed Date: -
- Root Cause: Likely the email template still uses the old order fields and links, and the new order response does not include the same data.
- Tags: Backend, Production issue, Migration
- Area Path: SmartphoneShop\Backend\Notifications

- Steps to Reproduce:

1. Use the Production post-release smoke test account (dedicated test account) and place an order with 1 accessory

2. Complete the payment and wait for the confirmation email

3. Open the email and click the "View order" link

- Actual Result: The email shows the old logo, the order total is "€ -" and the delivery address is empty. The "View order" link returns "404 Page not found".

- Expected Result: The email shows the new branding, the correct order number, items, total with taxes, and delivery address. The "View order" link opens the order details page.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Production smoke test account, Gmail web and Outlook desktop
error log: email-template-3390417.JSON


Bug example 32:

- Summary (Title): [BUG-032] - Cookie consent banner is shown on every page load and analytics scripts run before consent

- Description: In the new design the cookie consent choice is not saved. The banner is displayed on every page, and the analytics and marketing scripts are loaded before the visitor accepts them. This is a GDPR compliance risk.

- Priority: P1
- Severity: High
- Status: New
- Component: Cookie consent banner
- Category: Compliance
- Module: User Accounts & Authentication
- Created Date: 2026-10-13
- Closed Date: -
- Root Cause: Likely the consent cookie is not set with the correct domain and the script loader ignores the consent state in the new layout.
- Tags: Frontend, Production issue, Migration
- Area Path: SmartphoneShop\Frontend\Public\Layout

- Steps to Reproduce:

1. Open the website in Production as a visitor in a new private window

2. Before clicking on the banner, open DevTools (Network tab) and check the requests

3. Click "Reject all" and navigate to another page

- Actual Result: The analytics and marketing requests are sent before the consent. After "Reject all" the banner is displayed again on the next page, and the requests are still sent.

- Expected Result: No analytics or marketing scripts are loaded before the consent. The choice is saved, and the banner is not displayed again.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Production, visitor (no account), Windows 11, Chrome and Firefox latest versions
Compliance impact: GDPR and cookie consent requirement.
HAR file: cookie-consent-4420981.HAR


Bug example 33:

- Summary (Title): [BUG-033] - Saved delivery addresses are missing the phone number after the profile migration

- Description: After the migration of the profile and addresses to the new database schema, existing customers see their saved addresses without the phone number. At Checkout they must enter the phone again, and the courier shipments are created without a phone.

- Priority: P1
- Severity: High
- Status: In Progress
- Component: Delivery address data migration
- Category: Data
- Module: User Accounts & Authentication
- Created Date: 2026-10-15
- Closed Date: -
- Root Cause: Likely the migration script did not map the old column "phone" to the new column "contact_phone" for addresses created before 2026.
- Tags: Backend, Production issue, Migration
- Area Path: SmartphoneShop\Backend\Users

- Steps to Reproduce:

1. Log in to Production as a customer with a saved address created before the release (user ID 41872)

2. Open Profile and then "Delivery addresses"

3. Open the saved address for editing

- Actual Result: The "Phone" field is empty. The old database table still contains the value "+40 721 xxx xxx" for the same address.

- Expected Result: All saved addresses keep their phone number after the migration, and the field is pre-filled in the profile and at Checkout.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Production, user ID 41872, address ID 66102. About 12,000 addresses affected (query result).
error log: address-migration-2208731.JSON


Bug example 34:

- Summary (Title): [BUG-034] - Prices in the new product cards are shown without taxes

- Description: The new product card component shows the price without taxes, but the Checkout shows the price with taxes. Customers see a higher amount at the Checkout. Consumer protection rules require showing the price with taxes.

- Priority: P1
- Severity: High
- Status: Ready for QA
- Component: Product card price
- Category: Functional
- Module: Product Catalog
- Created Date: 2026-10-16
- Closed Date: -
- Root Cause: Likely the new component reads the field price_net instead of price_gross from the catalog API.
- Tags: Frontend, Production issue, Migration
- Area Path: SmartphoneShop\Frontend\Public\Catalog

- Steps to Reproduce:

1. Open the Catalog page in Production as a visitor and search "Anker 20W USB-C Charger"

2. Note the price in the product card

3. Open the product page, log in, add 1 unit to the cart, and open the Checkout page

- Actual Result: The product card shows 40.33 EUR. The Checkout shows 48.00 EUR (with 19% taxes).

- Expected Result: The product card, product page, cart, and Checkout show the same price with taxes, 48.00 EUR.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Production, product_ID 2045, Windows 11, Chrome latest version
Compliance impact: price with taxes must be shown (consumer protection).
error log: price-net-6615420.JSON


Bug example 35:

- Summary (Title): [BUG-035] - Stripe webhooks are rejected with 400 after the infrastructure migration to the new ECS service

- Description: After the backend was moved to the new ECS Fargate service behind the new load balancer, the Stripe webhook signature validation fails. Paid orders stay in "Pending" and the customers do not receive the confirmation email.

- Priority: P1
- Severity: Critical
- Status: Blocked
- Component: Stripe webhook signature validation
- Category: Integration
- Module: Checkout & Payments
- Created Date: 2026-10-19
- Closed Date: -
- Root Cause: Likely the new Production secret STRIPE_WEBHOOK_SECRET is not configured (it is still the Staging value), or the request body is modified by the load balancer before the signature check.
- Tags: Backend, Production issue, Migration
- Area Path: SmartphoneShop\Backend\Checkout\Webhooks

- Steps to Reproduce:

1. Use the Production post-release smoke test account and place an order with 1 accessory

2. Pay with the real card of the smoke test account (the amount is refunded after the test)

3. Check the order status in "My orders"

4. Check the webhook deliveries in the Stripe dashboard (Production)

- Actual Result: The payment is "Succeeded" in Stripe, but the order stays in "Pending". The webhook deliveries show the response 400 "Invalid signature". No confirmation email is sent and the stock is not deducted.

- Expected Result: The webhook is accepted with a 200 response, the order status changes to "Paid", the confirmation email is sent, and the stock is deducted.

- Additional Notes or Metadata (e.g., environment, logs, device, browser, version):
Production, smoke test account, order ID 120442, Stripe payment intent pi_live_9Qa17
Blocked until the DevOps team updates the secret in AWS Secrets Manager. 63 orders are in "Pending" and must be reconciled.
error log: webhook-signature-9031276.JSON
```
