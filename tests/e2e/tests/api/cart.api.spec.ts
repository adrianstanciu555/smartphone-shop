import { randomUUID } from "node:crypto";
import { expectError, expectStatus, type ApiCart } from "../../src/api/ApiClient";
import { cartItemContract, money } from "../../src/api/contracts";
import { API_PRODUCTS, MAX_QUANTITY_PER_ITEM, PRODUCTS } from "../../src/data/test-data";
import { expect, test } from "../../src/fixtures";

test.describe("Cart API", () => {
  test("a new customer has an empty cart", async ({ customerApi }) => {
    expect(await expectStatus(await customerApi.getCart(), 200)).toEqual({ items: [], itemCount: 0, total: money(0) });
  });

  test("adding items returns the recalculated cart @smoke", async ({ customerApi, customer, db }) => {
    const phoneCase = await db.getProductByName(PRODUCTS.iphoneCase);
    const cable = await db.getProductByName(PRODUCTS.budgetCable);

    await expectStatus(await customerApi.addCartItem(phoneCase.id, 2), 200);
    const cart = await expectStatus<ApiCart>(await customerApi.addCartItem(cable.id, 1), 200);

    for (const item of cart.items) expect(item).toEqual(cartItemContract());
    expect(cart.items.map(({ name, quantity }) => ({ name, quantity }))).toEqual([
      { name: PRODUCTS.iphoneCase, quantity: 2 },
      { name: PRODUCTS.budgetCable, quantity: 1 },
    ]);
    expect(cart.items[0].lineTotal).toEqual(money((phoneCase.priceCents * 2) / 100));
    expect(cart.itemCount).toBe(3);
    expect(cart.total).toEqual(money((phoneCase.priceCents * 2 + cable.priceCents) / 100));
    expect(await db.getActiveCartQuantities(customer.email)).toEqual({ [PRODUCTS.iphoneCase]: 2, [PRODUCTS.budgetCable]: 1 });
  });

  test("adding the same product again increases its quantity", async ({ customerApi, db }) => {
    const { id } = await db.getProductByName(PRODUCTS.budgetCable);

    await expectStatus(await customerApi.addCartItem(id, 2), 200);
    const cart = await expectStatus<ApiCart>(await customerApi.addCartItem(id, 3), 200);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(5);
  });

  test(`cannot hold more than ${MAX_QUANTITY_PER_ITEM} units across several additions`, async ({ customerApi, db }) => {
    const { id } = await db.getProductByName(PRODUCTS.budgetCable);
    await expectStatus(await customerApi.addCartItem(id, 8), 200);

    await expectError(await customerApi.addCartItem(id, 3), 422, "quantity_limit");

    const cart = await expectStatus<ApiCart>(await customerApi.getCart(), 200);
    expect(cart.items[0].quantity).toBe(8);
  });

  const invalidItems = [
    { label: "quantity 0", body: { quantity: 0 }, field: "quantity" },
    { label: `quantity ${MAX_QUANTITY_PER_ITEM + 1}`, body: { quantity: MAX_QUANTITY_PER_ITEM + 1 }, field: "quantity" },
    { label: "fractional quantity", body: { quantity: 1.5 }, field: "quantity" },
    { label: "quantity as string", body: { quantity: "2" }, field: "quantity" },
    { label: "malformed product id", body: { productId: "abc" }, field: "productId" },
  ];
  for (const { label, body, field } of invalidItems) {
    test(`rejects ${label} with 422`, async ({ customerApi, db }) => {
      const { id } = await db.getProductByName(PRODUCTS.budgetCable);
      const item = { productId: id, quantity: 1, ...body };

      const error = await expectError(await customerApi.addCartItem(item.productId, item.quantity), 422, "validation_error");

      expect(error.details?.map((d) => d.field)).toEqual([field]);
    });
  }

  test("out-of-stock products return 409", async ({ customerApi, db }) => {
    const { id } = await db.getProductByName(API_PRODUCTS.outOfStock);

    await expectError(await customerApi.addCartItem(id, 1), 409, "out_of_stock");
  });

  test("unknown products return 404", async ({ customerApi }) => {
    await expectError(await customerApi.addCartItem(randomUUID(), 1), 404, "not_found");
  });

  test("PATCH sets the quantity of an item", async ({ customerApi, db }) => {
    const { id, priceCents } = await db.getProductByName(PRODUCTS.iphoneCase);
    await expectStatus(await customerApi.addCartItem(id, 1), 200);

    const cart = await expectStatus<ApiCart>(await customerApi.updateCartItem(id, 4), 200);

    expect(cart.items[0]).toMatchObject({ quantity: 4, lineTotal: money((priceCents * 4) / 100) });
  });

  test("PATCH for a product that is not in the cart returns 404", async ({ customerApi, db }) => {
    const { id } = await db.getProductByName(PRODUCTS.iphoneCase);

    await expectError(await customerApi.updateCartItem(id, 2), 404, "not_in_cart");
  });

  test("PATCH for an out-of-stock product that is not in the cart returns 404, not 409", async ({ customerApi, db }) => {
    const { id } = await db.getProductByName(API_PRODUCTS.outOfStock);

    await expectError(await customerApi.updateCartItem(id, 1), 404, "not_in_cart");
  });

  test("DELETE removes only that item", async ({ customerApi, db }) => {
    const phoneCase = await db.getProductByName(PRODUCTS.iphoneCase);
    const cable = await db.getProductByName(PRODUCTS.budgetCable);
    await expectStatus(await customerApi.addCartItem(phoneCase.id, 1), 200);
    await expectStatus(await customerApi.addCartItem(cable.id, 1), 200);

    const cart = await expectStatus<ApiCart>(await customerApi.removeCartItem(phoneCase.id), 200);

    expect(cart.items.map((item) => item.name)).toEqual([PRODUCTS.budgetCable]);
    await expectError(await customerApi.removeCartItem(phoneCase.id), 404, "not_in_cart");
  });

  test("DELETE /cart empties the cart", async ({ customerApi, db }) => {
    const { id } = await db.getProductByName(PRODUCTS.iphoneCase);
    await expectStatus(await customerApi.addCartItem(id, 2), 200);

    await expectStatus(await customerApi.clearCart(), 204);

    expect((await expectStatus<ApiCart>(await customerApi.getCart(), 200)).items).toEqual([]);
  });

  test("carts are isolated between customers", async ({ customerApi, newCustomerApi, db }) => {
    const { id } = await db.getProductByName(PRODUCTS.iphoneCase);
    const otherCustomer = await newCustomerApi();
    await expectStatus(await customerApi.addCartItem(id, 1), 200);

    expect((await expectStatus<ApiCart>(await otherCustomer.getCart(), 200)).items).toEqual([]);
    await expectError(await otherCustomer.removeCartItem(id), 404, "not_in_cart");
    expect((await expectStatus<ApiCart>(await customerApi.getCart(), 200)).itemCount).toBe(1);
  });
});
