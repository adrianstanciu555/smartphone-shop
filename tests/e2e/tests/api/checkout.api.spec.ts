import { randomUUID } from "node:crypto";
import { expectError, expectStatus, type ApiCart, type ApiOrder } from "../../src/api/ApiClient";
import { money, orderContract } from "../../src/api/contracts";
import { ADDRESS, API_PRODUCTS, CARDS, checkoutBody, DELIVERY } from "../../src/data/test-data";
import { expect, test } from "../../src/fixtures";
import { includedTaxCents } from "../../src/utils/money";

test.describe("Checkout API", () => {
  test("pays for the cart, creates the order and deducts stock @smoke", async ({ customerApi, customer, db }) => {
    const product = await db.getProductByName(API_PRODUCTS.magneticCable);
    const stockBefore = await db.getStockOnHand(product.id);
    await expectStatus(await customerApi.addCartItem(product.id, 2), 200);

    const created = await expectStatus<{ orderId: string; status: string }>(
      await customerApi.checkout(checkoutBody(), randomUUID()),
      201,
    );

    expect(created).toEqual({ orderId: expect.any(String), status: "paid" });
    const order = await expectStatus<ApiOrder>(await customerApi.getOrder(created.orderId), 200);
    expect(order).toEqual(orderContract());
    const subtotalCents = product.priceCents * 2;
    expect(order).toMatchObject({
      id: created.orderId,
      status: "paid",
      deliveryMethod: "standard",
      items: [{ productId: product.id, name: product.name, quantity: 2, unitPrice: money(product.priceCents / 100), lineTotal: money(subtotalCents / 100) }],
      subtotal: money(subtotalCents / 100),
      tax: money(includedTaxCents(subtotalCents, product.taxRate) / 100),
      delivery: money(DELIVERY.standardCents / 100),
      total: money((subtotalCents + DELIVERY.standardCents) / 100),
      address: { ...ADDRESS },
    });
    expect(await db.getStockOnHand(product.id)).toBe(stockBefore - 2);
    expect((await expectStatus<ApiCart>(await customerApi.getCart(), 200)).items).toEqual([]);
    expect(await db.getOrdersForUser(customer.email)).toEqual([
      expect.objectContaining({ id: created.orderId, status: "paid", paymentStatus: "succeeded" }),
    ]);
  });

  test("replaying the Idempotency-Key returns the same order and charges once", async ({ customerApi, customer, db }) => {
    const product = await db.getProductByName(API_PRODUCTS.lightningCable);
    const stockBefore = await db.getStockOnHand(product.id);
    await expectStatus(await customerApi.addCartItem(product.id, 1), 200);
    const key = randomUUID();

    const first = await expectStatus<{ orderId: string }>(await customerApi.checkout(checkoutBody(), key), 201);
    const replay = await expectStatus<{ orderId: string }>(await customerApi.checkout(checkoutBody(), key), 201);

    expect(replay.orderId).toBe(first.orderId);
    expect(await db.getOrdersForUser(customer.email)).toHaveLength(1);
    expect(await db.getStockOnHand(product.id)).toBe(stockBefore - 1);
  });

  test("a declined card returns 402 and keeps the cart and stock", async ({ customerApi, customer, db }) => {
    const product = await db.getProductByName(API_PRODUCTS.wirelessCharger);
    const stockBefore = await db.getStockOnHand(product.id);
    await expectStatus(await customerApi.addCartItem(product.id, 1), 200);

    const error = await expectError(await customerApi.checkout(checkoutBody(CARDS.declined), randomUUID()), 402, "payment_declined");

    expect(error.orderId).toEqual(expect.any(String));
    expect(await db.getOrdersForUser(customer.email)).toEqual([
      expect.objectContaining({ id: error.orderId, status: "payment_failed", paymentStatus: "failed", failureCode: "card_declined" }),
    ]);
    expect(await db.getStockOnHand(product.id)).toBe(stockBefore);
    expect((await expectStatus<ApiCart>(await customerApi.getCart(), 200)).itemCount).toBe(1);

    // A new key lets the customer retry with a working card.
    await expectStatus(await customerApi.checkout(checkoutBody(), randomUUID()), 201);
    expect(await db.getStockOnHand(product.id)).toBe(stockBefore - 1);
  });

  const deliveryCases = [
    { product: API_PRODUCTS.bluetoothHeadphones, method: "standard", feeCents: DELIVERY.standardCents, note: "just under the free threshold" },
    { product: API_PRODUCTS.chargingStand, method: "standard", feeCents: 0, note: "free from 50 EUR" },
    { product: API_PRODUCTS.gan65Charger, method: "express", feeCents: DELIVERY.expressCents, note: "express always charged" },
  ] as const;
  for (const { product: name, method, feeCents, note } of deliveryCases) {
    test(`delivery fee: ${method}, ${note}`, async ({ customerApi, db }) => {
      const product = await db.getProductByName(name);
      await expectStatus(await customerApi.addCartItem(product.id, 1), 200);

      const { orderId } = await expectStatus<{ orderId: string }>(
        await customerApi.checkout(checkoutBody(CARDS.success, method), randomUUID()),
        201,
      );

      const order = await expectStatus<ApiOrder>(await customerApi.getOrder(orderId), 200);
      expect(order.delivery).toEqual(money(feeCents / 100));
      expect(order.total).toEqual(money((product.priceCents + feeCents) / 100));
    });
  }

  test("an empty cart returns 409", async ({ customerApi }) => {
    await expectError(await customerApi.checkout(checkoutBody(), randomUUID()), 409, "cart_empty");
  });

  for (const [label, key] of [["missing", undefined], ["not a UUID", "order-1"]] as const) {
    test(`Idempotency-Key ${label} returns 400`, async ({ customerApi }) => {
      await expectError(await customerApi.checkout(checkoutBody(), key), 400, "idempotency_key_required");
    });
  }

  test("invalid fields return 422 with a detail per field and create no order", async ({ customerApi, customer, db }) => {
    const { id } = await db.getProductByName(API_PRODUCTS.magneticCable);
    await expectStatus(await customerApi.addCartItem(id, 1), 200);
    const body = { ...checkoutBody(CARDS.unsupported), postalCode: "!", country: "Romania", expiry: "13/30", recipient: undefined };

    const error = await expectError(await customerApi.checkout(body, randomUUID()), 422, "validation_error");

    expect(error.details?.map((d) => d.field).sort()).toEqual(["cardNumber", "country", "expiry", "postalCode", "recipient"]);
    expect(JSON.stringify(error)).not.toContain(CARDS.unsupported.replace(/ /g, ""));
    expect(await db.getOrdersForUser(customer.email)).toEqual([]);
  });

  test("customers cannot read another customer's order", async ({ customerApi, newCustomerApi, db }) => {
    const product = await db.getProductByName(API_PRODUCTS.magneticCable);
    const buyer = await newCustomerApi();
    await expectStatus(await buyer.addCartItem(product.id, 1), 200);
    // Declined, so this test does not change the stock that the paid-order test asserts on.
    const { orderId } = await expectError(await buyer.checkout(checkoutBody(CARDS.declined), randomUUID()), 402, "payment_declined");

    await expectStatus(await buyer.getOrder(orderId!), 200);
    await expectError(await customerApi.getOrder(orderId!), 404, "not_found");
  });

  test("malformed order ids return 404", async ({ customerApi }) => {
    await expectError(await customerApi.getOrder("not-a-uuid"), 404, "not_found");
  });
});
