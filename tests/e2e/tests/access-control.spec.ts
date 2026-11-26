import { ADDRESS, newCustomer, payment, PRODUCTS } from "../src/data/test-data";
import { expect, test } from "../src/fixtures";
import { LoginPage, OrderPage } from "../src/pages";

test.describe("Access control", () => {
  for (const path of ["/cart", "/checkout", "/orders/00000000-0000-0000-0000-000000000000"]) {
    test(`anonymous visitors are redirected to login from ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
    });
  }

  test("customers cannot view another customer's order", async ({ addToCart, checkoutPage, orderPage, browser }) => {
    await addToCart(PRODUCTS.iphoneCase, 1);
    await checkoutPage.goto();
    await checkoutPage.placeOrder(ADDRESS, payment());
    const orderId = await orderPage.waitForOrder();

    const otherContext = await browser.newContext();
    try {
      const otherPage = await otherContext.newPage();
      const otherLogin = new LoginPage(otherPage);
      await otherLogin.goto();
      await otherLogin.loginAs(newCustomer("e2e.other"));

      const response = await new OrderPage(otherPage).goto(orderId);

      expect(response?.status()).toBe(404);
      await expect(otherPage.getByTestId("order-confirmation")).toHaveCount(0);
    } finally {
      await otherContext.close();
    }
  });

  test("a tampered session cookie is treated as logged out", async ({ page, context, header, signedInCustomer }) => {
    void signedInCustomer;
    const [session] = (await context.cookies()).filter((cookie) => cookie.name === "session");
    expect(session).toBeDefined();
    await context.addCookies([{ ...session, value: `${session.value.slice(0, -4)}AAAA` }]);

    await page.goto("/cart");

    await expect(page).toHaveURL(/\/login\?next=%2Fcart$/);
    await expect(header.loginLink).toBeVisible();
  });
});
