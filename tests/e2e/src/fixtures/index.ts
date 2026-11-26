import path from "node:path";
import { test as base, expect, type APIRequestContext } from "@playwright/test";
import * as allure from "allure-js-commons";
import { ApiClient, expectStatus } from "../api/ApiClient";
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
  /** Anonymous REST API client (own cookie jar, no browser). */
  api: ApiClient;
  /** REST API client logged in as `customer`. */
  customerApi: ApiClient;
  /** Creates another logged-in API client with its own cookie jar, e.g. for a second customer. */
  newCustomerApi: (customer?: Customer) => Promise<ApiClient>;
  /** Automatic: Allure layer, epic, feature and severity labels for every test. */
  allureLabels: void;
};

/** First folder under tests/ -> Allure layer and epic. Root-level specs are browser UI tests. */
const ALLURE_LAYERS: Record<string, { layer: string; epic: string }> = {
  api: { layer: "api", epic: "REST API" },
  mocks: { layer: "ui-mocked-api", epic: "UI with mocked API" },
};
const UI_LAYER = { layer: "ui", epic: "UI" };

type WorkerFixtures = { db: DbHelper };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  allureLabels: [
    async ({}, use, testInfo) => {
      const folder = path.relative(testInfo.project.testDir, testInfo.file).split(path.sep)[0];
      const { layer, epic } = ALLURE_LAYERS[folder] ?? UI_LAYER;
      await allure.layer(layer);
      await allure.epic(epic);
      // titlePath is [file, describe, ..., test]; every spec has one top-level describe per feature.
      await allure.feature(testInfo.titlePath.length > 2 ? testInfo.titlePath[1] : path.basename(testInfo.file));
      await allure.severity(testInfo.tags.includes("@smoke") ? allure.Severity.CRITICAL : allure.Severity.NORMAL);
      await use();
    },
    { auto: true },
  ],

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

  api: async ({ request }, use) => use(new ApiClient(request)),

  customerApi: async ({ api, customer }, use) => {
    await expectStatus(await api.login(customer), 200);
    await use(api);
  },

  newCustomerApi: async ({ playwright, baseURL }, use, testInfo) => {
    const contexts: APIRequestContext[] = [];
    await use(async (customer = newCustomer(`api.w${testInfo.workerIndex}`)) => {
      const context = await playwright.request.newContext({ baseURL });
      contexts.push(context);
      const client = new ApiClient(context);
      await expectStatus(await client.login(customer), 200);
      return client;
    });
    await Promise.all(contexts.map((context) => context.dispose()));
  },
});

export { expect };
