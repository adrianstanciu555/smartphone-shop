import { ApiClient, expectStatus } from "../src/api/ApiClient";
import { MAX_QUANTITY_PER_ITEM, PRODUCTS } from "../src/data/test-data";
import { expect, test } from "../src/fixtures";
import { formatEur } from "../src/utils/money";

test.describe("Cart", () => {
  test("anonymous visitors are sent to login when adding to cart", async ({ productPage, db, page }) => {
    const product = await db.getProductByName(PRODUCTS.iphoneCase);
    await productPage.goto(product.id);

    await productPage.addToCartButton.click();

    await expect(page).toHaveURL(`/login?next=${encodeURIComponent(`/product/${product.id}`)}`);
  });

  test("adds a product with the chosen quantity @smoke", async ({ productPage, cartPage, header, db, signedInCustomer }) => {
    const product = await db.getProductByName(PRODUCTS.iphoneCase);
    await productPage.goto(product.id);

    await productPage.addToCart(3);

    await expect(productPage.successMessage).toHaveText("Added to cart.");
    await header.expectCartCount(3);

    await cartPage.goto();
    const item = cartPage.item(PRODUCTS.iphoneCase);
    await expect(item.quantityInput).toHaveValue("3");
    await expect(item.unitPrice).toHaveText(formatEur(product.priceCents));
    await expect(item.lineTotal).toHaveText(formatEur(product.priceCents * 3));
    await expect(cartPage.subtotal).toHaveText(formatEur(product.priceCents * 3));
    expect(await db.getActiveCartQuantities(signedInCustomer.email)).toEqual({ [PRODUCTS.iphoneCase]: 3 });
  });

  test("adding the same product again increases its quantity", async ({ addToCart, cartPage, header }) => {
    await addToCart(PRODUCTS.budgetCable, 2);
    await addToCart(PRODUCTS.budgetCable, 3);

    await header.expectCartCount(5);
    await cartPage.goto();
    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.item(PRODUCTS.budgetCable).quantityInput).toHaveValue("5");
  });

  test(`cannot hold more than ${MAX_QUANTITY_PER_ITEM} units of one product`, async ({ addToCart, productPage, header }) => {
    await addToCart(PRODUCTS.budgetCable, 8);

    await productPage.addToCart(3);

    await expect(productPage.errorMessage).toHaveText(`You can buy at most ${MAX_QUANTITY_PER_ITEM} units of this product.`);
    await header.expectCartCount(8);
  });

  test("updating the quantity recalculates line total and subtotal", async ({ addToCart, cartPage, header }) => {
    const caseProduct = await addToCart(PRODUCTS.iphoneCase, 1);
    const cable = await addToCart(PRODUCTS.budgetCable, 2);
    await cartPage.goto();

    await cartPage.item(PRODUCTS.iphoneCase).updateQuantity(4);

    await expect(cartPage.item(PRODUCTS.iphoneCase).lineTotal).toHaveText(formatEur(caseProduct.priceCents * 4));
    await expect(cartPage.subtotal).toHaveText(formatEur(caseProduct.priceCents * 4 + cable.priceCents * 2));
    await header.expectCartCount(6);
  });

  test("quantity above the maximum is blocked by the browser", async ({ addToCart, cartPage }) => {
    await addToCart(PRODUCTS.iphoneCase, 1);
    await cartPage.goto();
    const item = cartPage.item(PRODUCTS.iphoneCase);

    await item.quantityInput.fill(String(MAX_QUANTITY_PER_ITEM + 1));
    await item.updateButton.click();

    expect(await item.quantityInput.evaluate((input: HTMLInputElement) => input.validity.rangeOverflow)).toBe(true);
    await expect(item.lineTotal).toHaveText(await item.unitPrice.innerText());
  });

  test("removing the last item shows the empty cart", async ({ addToCart, cartPage, header, db, signedInCustomer }) => {
    await addToCart(PRODUCTS.screenProtector, 2);
    await cartPage.goto();

    await cartPage.item(PRODUCTS.screenProtector).remove();

    await expect(cartPage.emptyState).toContainText("Your cart is empty.");
    await header.expectCartCount(0);
    expect(await db.getActiveCartQuantities(signedInCustomer.email)).toEqual({});
  });

  test("removing one item keeps the others", async ({ addToCart, cartPage }) => {
    await addToCart(PRODUCTS.screenProtector, 1);
    const cable = await addToCart(PRODUCTS.budgetCable, 1);
    await cartPage.goto();

    await cartPage.item(PRODUCTS.screenProtector).remove();

    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.subtotal).toHaveText(formatEur(cable.priceCents));
  });

  test("checkout with an empty cart redirects to the cart", async ({ page, cartPage, signedInCustomer }) => {
    void signedInCustomer;
    await page.goto("/checkout");

    await expect(page).toHaveURL(/\/cart$/);
    await expect(cartPage.emptyState).toBeVisible();
  });

  test("a cart filled through the API is shown in the UI", async ({ page, cartPage, header, db, signedInCustomer }) => {
    void signedInCustomer;
    // page.request shares the browser context's cookies, so it acts as the logged-in customer.
    const api = new ApiClient(page.request);
    const phoneCase = await db.getProductByName(PRODUCTS.iphoneCase);
    const cable = await db.getProductByName(PRODUCTS.budgetCable);
    await expectStatus(await api.addCartItem(phoneCase.id, 2), 200);
    await expectStatus(await api.addCartItem(cable.id, 1), 200);

    await cartPage.goto();

    await expect(cartPage.items).toHaveCount(2);
    await expect(cartPage.item(PRODUCTS.iphoneCase).quantityInput).toHaveValue("2");
    await expect(cartPage.subtotal).toHaveText(formatEur(phoneCase.priceCents * 2 + cable.priceCents));
    await header.expectCartCount(3);
  });
});
