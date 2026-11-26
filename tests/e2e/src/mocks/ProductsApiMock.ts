import { randomUUID } from "node:crypto";
import type { Page, Route } from "@playwright/test";
import type { ApiProduct, ProductPage } from "../api/ApiClient";

export function fakeProduct(overrides: Partial<ApiProduct> = {}): ApiProduct {
  return {
    id: randomUUID(),
    sku: `MOCK-${randomUUID().slice(0, 8)}`,
    name: "Mockphone 1 128GB",
    brand: "Mockbrand",
    category: "smartphone",
    price: { amount: 499.99, currency: "EUR" },
    rating: 4.5,
    availability: "in_stock",
    images: [],
    ...overrides,
  };
}

export function productPage(items: ApiProduct[], pageSize = 5): ProductPage {
  return { items, page: 1, pageSize, total: items.length };
}

/**
 * Intercepts the browser's calls to GET /api/v1/products (catalog search suggestions).
 * Only browser traffic is intercepted; server-rendered pages still read the real database.
 */
export class ProductsApiMock {
  /** URLs of every intercepted request, in order. */
  readonly requests: URL[] = [];

  private constructor() {}

  private static async install(page: Page, handler: (route: Route) => Promise<void>): Promise<ProductsApiMock> {
    const mock = new ProductsApiMock();
    await page.route(
      (url) => url.pathname === "/api/v1/products",
      async (route) => {
        mock.requests.push(new URL(route.request().url()));
        await handler(route);
      },
    );
    return mock;
  }

  /** Returns a fixed product list. */
  static respondWith(page: Page, items: ApiProduct[]): Promise<ProductsApiMock> {
    return ProductsApiMock.install(page, (route) => route.fulfill({ json: productPage(items) }));
  }

  /** Returns an HTTP error in the API's error format. */
  static failWith(page: Page, status: number): Promise<ProductsApiMock> {
    return ProductsApiMock.install(page, (route) =>
      route.fulfill({ status, json: { code: "mock_error", message: `Mocked ${status}` } }),
    );
  }

  /** Simulates a network failure (no HTTP response at all). */
  static abort(page: Page): Promise<ProductsApiMock> {
    return ProductsApiMock.install(page, (route) => route.abort("internetdisconnected"));
  }

  /** Calls the real API and lets the test rewrite the response body. */
  static patchRealResponse(page: Page, patch: (body: ProductPage) => ProductPage): Promise<ProductsApiMock> {
    return ProductsApiMock.install(page, async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, json: patch((await response.json()) as ProductPage) });
    });
  }

  /** Holds every response until `release()` is called, to make loading states observable. */
  static async held(page: Page, items: ApiProduct[]): Promise<{ mock: ProductsApiMock; release: () => void }> {
    let release!: () => void;
    const released = new Promise<void>((resolve) => (release = resolve));
    const mock = await ProductsApiMock.install(page, async (route) => {
      await released;
      await route.fulfill({ json: productPage(items) });
    });
    return { mock, release };
  }
}
