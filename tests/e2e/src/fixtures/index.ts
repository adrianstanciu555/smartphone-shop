import { test as base, expect } from "@playwright/test";
import { newCustomer, type Customer } from "../data/test-data";
import { DbHelper, type DbProduct } from "../helpers/db";
import { CartPage, CatalogPage, CheckoutPage, Header, LoginPage, OrderPage, ProductPage } from "../pages";

type PageFixtures = {
  header: Header;
  loginPage: LoginPage;
  catalogPage: CatalogPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderPage: OrderPage;
};

type TestFixtures = PageFixtures & {
  /** Fresh, not yet registered credentials. */
  customer: Customer;
  /** A brand-new customer who is already logged in on `page`. */
  signedInCustomer: Customer;
  /** Adds a seeded product (looked up by name) to the signed-in customer's cart. */
  addToCart: (productName: string, quantity?: number) => Promise<DbProduct>;
};

type WorkerFixtures = { db: DbHelper };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  db: [
    async ({}, use) => {
      const db = new DbHelper();
      await use(db);
      await db.close();
    },
    { scope: "worker" },
  ],

  header: async ({ page }, use) => use(new Header(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  catalogPage: async ({ page }, use) => use(new CatalogPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  orderPage: async ({ page }, use) => use(new OrderPage(page)),

  customer: async ({}, use, testInfo) => use(newCustomer(`e2e.w${testInfo.workerIndex}`)),

  signedInCustomer: async ({ loginPage, customer }, use) => {
    await loginPage.goto();
    await loginPage.loginAs(customer);
    await use(customer);
  },

  addToCart: async ({ db, productPage, signedInCustomer }, use) => {
    void signedInCustomer; // Adding to cart requires a session.
    await use(async (productName, quantity = 1) => {
      const product = await db.getProductByName(productName);
      await productPage.goto(product.id);
      await productPage.addToCart(quantity);
      await expect(productPage.successMessage).toBeVisible();
      return product;
    });
  },
});

export { expect };
