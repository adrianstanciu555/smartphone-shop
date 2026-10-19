## Prompt Template: User Story Analysis for QA Engineer

You are a Senior QA Engineer performing a detailed analysis of one or more user stories to ensure they are ready for testing.
Your objective is to identify gaps, ambiguities, and testability risks, and propose concrete questions or test ideas that improve clarity and coverage.

### Use the following criteria during analysis:

✅ QA-Focused Analysis Criteria:
1. Clarity – Is the story clearly written with unambiguous behavior?
2. Testability – Are acceptance criteria well-defined and verifiable via manual or automated tests?
3. Edge Cases – Are corner cases and invalid scenarios considered?
4. Dependencies – Are all backend, third-party, or data dependencies stated?
5. Acceptance Criteria Format – Are criteria written in Gherkin (Given-When-Then) or equivalent structured format?
6. Negative Testing – Are failure modes or system behavior under error conditions covered?
7. Environment/Mocking Needs – Are any test environments, data mocks, or configs needed?
8. Performance/Security Considerations – Are NFRs (performance, security) explicitly excluded or covered?
9. Regression Scope – Will this feature impact existing functionality or require regression testing?

### Your Output Format:
For each story provided, return analysis in the following structure, inside a Markdown script block:

```markdown

### User Story:
[Paste the full story here]

---

### Issues Found:
- [Short bullet points listing each quality or testability issue found]

---

### Clarification & Test Design Questions:
- Q1: [Specific question to the PO or BA] (e.g., What should happen if the user tries to save with an empty title? — Expected answer format: show validation error, auto-fill, ignore input, etc.)
- Q2: ...
- Q3: ...

---

### Suggested Test Scenarios:
- ✅ Positive: [Brief test idea for a standard scenario]
- ❌ Negative: [Brief test idea for a negative or edge scenario]
- 🔁 Regression: [Any area that may be affected and should be retested]
```

---

## Example: STORY-1347 – Apply Black Friday coupon code "BF2026" at checkout

```markdown

### User Story:
[STORY-1347] Apply Black Friday coupon code "BF2026" at checkout (full text in user-story-example.txt)

---

### Issues Found:
- The product scope is listed in the description (Android and iOS smartphones, cases, screen protectors, cables, chargers), but AC1 omits screen protectors and does not say what is excluded (e.g., out-of-stock, pre-order, gift cards, already discounted items). The description also contains typos ("smarphone", "accesories", "casses", "charges").
- The definition of "same product" is unclear: is a different color, storage size (256GB vs 512GB), or variant a different product_ID?
- The usage limit is stated three times ("per one unit", "once per 1 unit of the same product per user_ID", "per 1 QTY of the same product for only 1 user_ID"), but it is not explicit whether the limit is per product or per campaign. The cart behavior with different products is only implied by the example.
- AC1 and AC2 do not say which unit is discounted when units are priced differently, or how the discount is shown (line item, new total, rounding).
- No AC for the promotion period: before 2026-11-27 00:00 or after 2026-11-30 23:59:59, there is no expected behavior or message.
- No AC for a coupon already redeemed by the same user for the same product (second order) and no message text.
- AC3 contradicts the validation rule: "BF2026" is case-insensitive but the AC quotes it exactly, and there is no rule for whitespace or special characters. It also does not state whether an empty code or an expired code gets the same message.
- No AC for a failed, cancelled, or abandoned payment (is the redemption released?), or for an order cancellation, refund, or return after redemption.
- AC5 does not say when the redemption is stored (order confirmation or payment), whether discount amount includes VAT, or how concurrent checkouts are handled.
- The description does not say whether the coupon combines with existing promotions, sale prices, or other discounts.
- Dependencies are not stated: the order, payment, user, and product catalog services, and the redemption storage.
- NFRs are not addressed: security (brute-force coupon attempts, client-side tampering), performance under Black Friday load, and audit logging.
- "User", "registered user", and "Guest" are not defined (e.g., a user who logs in during checkout).

---

### Clarification & Test Design Questions:
- Q1: Which products are eligible: all smartphones and accessories in the catalog, or only specific categories? Are screen protectors included (they are in the description but not in AC1)? — Expected: the list of categories, and the exclusions (out-of-stock, pre-order, already discounted).
- Q2: What identifies "the same product": product_ID, or product_ID plus variant (color, storage)? Is a Samsung Galaxy S26 Ultra 512GB the same product as the 256GB version? — Expected: the rule based on product_ID or SKU.
- Q3: Is the limit "1 unit per product per user for the whole campaign" or "per order"? Can the user use the coupon again on a later order for the same product? — Expected: once per campaign, with an error message for a repeat.
- Q4: Can the user get the discount on several different products in the same cart (e.g., a phone, a case, and a charger, each 1 unit)? Is there a cap on the number of discounted items or the total discount value? — Expected: a rule and a worked example.
- Q5: In AC2 (2 units of the same product), which unit gets the discount if the line items have different prices? — Expected: a deterministic rule.
- Q6: What message is shown when the code is entered outside the promotion period, and where is the date checked (coupon entry, order submission, payment)? — Expected: message text and the validation point.
- Q7: Which timezone and boundary rules apply (Europe/Bucharest is UTC+2 in November)? Is 2026-11-30 23:59:59 inclusive, and which clock is used (server)? — Expected: inclusive boundaries, server time.
- Q8: Is the code case-insensitive only for letters, or is it also trimmed for spaces? Are "bf2026", " BF2026 ", and "BF-2026" valid? — Expected: the accepted-input rules.
- Q9: Is the "This coupon is not valid" message the same for an empty code, an expired code, and an unknown code? Is there a limit on invalid attempts? — Expected: messages and rate limiting.
- Q10: What happens to a guest after "Please log in to use this coupon"? Is the cart preserved and the coupon re-applied after login or registration? — Expected: the flow after login.
- Q11: If payment fails or the user abandons checkout, is the coupon reserved or released? What about order cancellation, refund, or partial return of the discounted unit? Is the redemption record deleted, flagged, or kept? — Expected: the rule for each case.
- Q12: What happens with two simultaneous checkouts (two tabs, two devices) of the same user for the same product? — Expected: only one succeeds.
- Q13: Does the coupon combine with existing product discounts, sale prices, or other vouchers? — Expected: stackable or not.
- Q14: How is the 20% calculated (before or after VAT and shipping), and what is the rounding rule and currency? — Expected: formula and rounding (e.g., 2 decimals, half-up).
- Q15: Which UI elements show the discount (line item, new total, applied coupon label), and can the user remove the coupon? — Expected: UI/UX specification or mockup.
- Q16: What exactly is stored in the redemption record (discount amount with or without VAT, currency, order_ID), and how can testers check it (DB, API, report)? — Expected: schema and an access method.
- Q17: Is there a way to change the system date and to prepare test data (registered users, products, stock) in the test environment? — Expected: environment and mocking support, or a feature flag.
- Q18: Are NFRs in scope (load on Black Friday, security of the coupon endpoint, accessibility, localization of messages, supported browsers and mobile)? — Expected: in or out of scope.

---

### Suggested Test Scenarios:
- ✅ Positive: A registered user buys 1 unit of a smartphone with "BF2026" during the period: 20% off that unit, and the redemption record is stored with correct values (AC1, AC5).
- ✅ Positive: The same check for each accessory type: case, screen protector, cable, charger, and for both Android and iOS products.
- ✅ Positive: "bf2026" or "Bf2026" is accepted (case-insensitive).
- ✅ Positive: 2 units of the same product: only 1 unit discounted, the second at full price (AC2).
- ✅ Positive: A cart with 3 different products (qty 1 each): the discount is applied per the answer to Q4.
- ✅ Positive: Boundary times 2026-11-27 00:00:00 and 2026-11-30 23:59:59 are accepted.
- ❌ Negative: Invalid codes ("BF2025", "SAVE10", empty, spaces, special characters, very long string, SQL/script injection) show "This coupon is not valid" (AC3).
- ❌ Negative: A guest applies "BF2026": "Please log in to use this coupon" is shown and no discount is applied (AC4).
- ❌ Negative: 2026-11-26 23:59:59 and 2026-12-01 00:00:00 are rejected; check the UTC offset handling.
- ❌ Negative: The same user reuses the coupon for the same product on a second order: the discount is rejected.
- ❌ Negative: Payment fails or is cancelled: no redemption record is stored and the coupon can be reused.
- ❌ Negative: Concurrent checkouts in two sessions: only one redemption is stored.
- ❌ Negative: The discount is tampered with via API/DevTools (manual discount value in the request) and is rejected server-side.
- 🔁 Regression: Checkout totals, VAT, shipping, rounding, and payment flow without a coupon.
- 🔁 Regression: Existing promotions and discounts, the order history and invoices, and order cancellations/refunds.
- 🔁 Regression: Guest checkout and login/registration flows, and the cart behavior after login.
- 🔁 Regression: Reporting/analytics and email confirmations that use the order amounts.
```