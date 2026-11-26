import { ADDRESS, CARDS, DELIVERY, payment, PRODUCTS } from "../src/data/test-data";
import { expect, test } from "../src/fixtures";
import { formatEur, includedTaxCents } from "../src/utils/money";

test.describe("Checkout", () => {
  test("successful payment creates a paid order and deducts stock @smoke", async ({
    addToCart, cartPage, checkoutPage, orderPage, header, db, signedInCustomer,
  }) => {
    const product = await addToCart(PRODUCTS.cheapCable, 2);
    const stockBefore = await db.getStockOnHand(product.id);
    const subtotal = product.priceCents * 2;
    const total = subtotal + DELIVERY.standardCents;

    await cartPage.goto();
    await cartPage.proceedToCheckout();
    await expect(checkoutPage.items).toHaveCount(1);
    await checkoutPage.expectSummary({ subtotal: formatEur(subtotal), delivery: formatEur(DELIVERY.standardCents), total: formatEur(total) });
    await expect(checkoutPage.payButton).toHaveText(`Pay ${formatEur(total)}`);

    await checkoutPage.placeOrder(ADDRESS, payment(CARDS.success), "standard");

    const orderId = await orderPage.waitForOrder();
    await expect(orderPage.heading).toHaveText("Thank you for your order!");
    await expect(orderPage.status).toHaveText("paid");
    await expect(orderPage.item(PRODUCTS.cheapCable).getByTestId("order-item-quantity")).toHaveText("2");
    await expect(orderPage.subtotal).toHaveText(formatEur(subtotal));
    await expect(orderPage.delivery).toHaveText(formatEur(DELIVERY.standardCents));
    await expect(orderPage.tax).toHaveText(formatEur(includedTaxCents(subtotal, product.taxRate)));
    await expect(orderPage.total).toHaveText(formatEur(total));
    await expect(orderPage.address).toContainText(`${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`);
    await header.expectCartCount(0);

    const [order] = await db.getOrdersForUser(signedInCustomer.email);
    expect(order).toMatchObject({ id: orderId, status: "paid", deliveryMethod: "standard", totalCents: total, paymentStatus: "succeeded" });
    expect(await db.getStockOnHand(product.id)).toBe(stockBefore - 2);
    expect(await db.getActiveCartQuantities(signedInCustomer.email)).toEqual({});
  });

  test("delivery cost: standard is free from €50, express always costs €9.99", async ({ addToCart, checkoutPage }) => {
    const product = await addToCart(PRODUCTS.headphones, 1);
    expect(product.priceCents).toBeGreaterThanOrEqual(DELIVERY.freeStandardFromCents);
    await checkoutPage.goto();

    await expect(checkoutPage.deliveryOption("standard")).toBeChecked();
    await checkoutPage.expectSummary({ subtotal: formatEur(product.priceCents), delivery: formatEur(0), total: formatEur(product.priceCents) });

    await checkoutPage.chooseDelivery("express");

    const expressTotal = formatEur(product.priceCents + DELIVERY.expressCents);
    await checkoutPage.expectSummary({ subtotal: formatEur(product.priceCents), delivery: formatEur(DELIVERY.expressCents), total: expressTotal });
    await expect(checkoutPage.payButton).toHaveText(`Pay ${expressTotal}`);
  });

  test("declined card keeps the cart and stock, and the customer can retry", async ({
    addToCart, checkoutPage, orderPage, header, db, signedInCustomer, page,
  }) => {
    const product = await addToCart(PRODUCTS.usbCharger, 1);
    const stockBefore = await db.getStockOnHand(product.id);
    await checkoutPage.goto();

    await checkoutPage.placeOrder(ADDRESS, payment(CARDS.declined), "standard");

    await expect(checkoutPage.formError).toHaveText("Payment declined. Your card was not charged.");
    await expect(page).toHaveURL(/\/checkout$/);
    // Address is kept for the retry, card data is never echoed back.
    await expect(checkoutPage.field("recipient")).toHaveValue(ADDRESS.recipient);
    await expect(checkoutPage.field("cardNumber")).toHaveValue("");
    await expect(checkoutPage.field("cvc")).toHaveValue("");
    await header.expectCartCount(1);
    expect(await db.getStockOnHand(product.id)).toBe(stockBefore);
    expect(await db.getOrdersForUser(signedInCustomer.email)).toMatchObject([
      { status: "payment_failed", paymentStatus: "failed", failureCode: "card_declined" },
    ]);

    await checkoutPage.fillPayment(payment(CARDS.success));
    await checkoutPage.pay();

    await orderPage.waitForOrder();
    await expect(orderPage.status).toHaveText("paid");
    expect(await db.getStockOnHand(product.id)).toBe(stockBefore - 1);
    expect(await db.getOrdersForUser(signedInCustomer.email)).toMatchObject([
      { status: "payment_failed" },
      { status: "paid", paymentStatus: "succeeded" },
    ]);
  });

  // Regression: the delivery radio was reset to "standard" after a failed submit while the summary still showed express.
  test("chosen express delivery survives a validation error and is charged", async ({
    addToCart, checkoutPage, orderPage, db, signedInCustomer,
  }) => {
    const product = await addToCart(PRODUCTS.wirelessCharger, 1);
    await checkoutPage.goto();
    await checkoutPage.fillAddress(ADDRESS);
    await checkoutPage.chooseDelivery("express");
    await checkoutPage.fillPayment({ ...payment(CARDS.success), cvc: "12" });

    await checkoutPage.pay();

    await expect(checkoutPage.fieldError("cvc")).toHaveText("CVC must be 3 digits.");
    await expect(checkoutPage.deliveryOption("express")).toBeChecked();
    await expect(checkoutPage.summaryDelivery).toHaveText(formatEur(DELIVERY.expressCents));

    await checkoutPage.fillPayment(payment(CARDS.success));
    await checkoutPage.pay();

    await orderPage.waitForOrder();
    await expect(orderPage.delivery).toHaveText(formatEur(DELIVERY.expressCents));
    await expect(orderPage.total).toHaveText(formatEur(product.priceCents + DELIVERY.expressCents));
    expect(await db.getOrdersForUser(signedInCustomer.email)).toMatchObject([{ status: "paid", deliveryMethod: "express" }]);
  });

  test("empty form shows an error for every required field and creates no order", async ({
    addToCart, checkoutPage, db, signedInCustomer,
  }) => {
    await addToCart(PRODUCTS.iphoneCase, 1);
    await checkoutPage.goto();

    await checkoutPage.pay();

    const expected = {
      recipient: "Full name is required.",
      phone: "Enter a valid phone number.",
      line1: "Address line 1 is required.",
      city: "City is required.",
      postalCode: "Enter a valid postal code.",
      country: "Use a 2-letter country code, e.g. RO.",
      cardName: "Name on card is required.",
      cardNumber: "Card number must have 16 digits.",
      expiry: "Use MM/YY format.",
      cvc: "CVC must be 3 digits.",
    } as const;
    for (const [field, message] of Object.entries(expected)) {
      await expect(checkoutPage.fieldError(field as keyof typeof expected)).toHaveText(message);
    }
    await expect(checkoutPage.fieldError("line2")).toHaveCount(0);
    await expect(checkoutPage.field("recipient")).toHaveAttribute("aria-invalid", "true");
    expect(await db.getOrdersForUser(signedInCustomer.email)).toEqual([]);
  });

  const invalidCards = [
    { title: "unsupported card", change: { cardNumber: CARDS.unsupported }, field: "cardNumber", message: "Card not supported. Use a test card." },
    { title: "card failing the Luhn check", change: { cardNumber: "4242 4242 4242 4241" }, field: "cardNumber", message: "Card number is invalid." },
    { title: "expired card", change: { expiry: "01/20" }, field: "expiry", message: "Card has expired." },
    { title: "invalid expiry month", change: { expiry: "13/30" }, field: "expiry", message: "Use MM/YY format." },
  ] as const;

  for (const { title, change, field, message } of invalidCards) {
    test(`rejects ${title}`, async ({ addToCart, checkoutPage }) => {
      await addToCart(PRODUCTS.iphoneCase, 1);
      await checkoutPage.goto();
      await checkoutPage.fillAddress(ADDRESS);
      await checkoutPage.fillPayment({ ...payment(), ...change });

      await checkoutPage.pay();

      await expect(checkoutPage.fieldError(field)).toHaveText(message);
      await expect(checkoutPage.formError).toHaveCount(0);
    });
  }
});
