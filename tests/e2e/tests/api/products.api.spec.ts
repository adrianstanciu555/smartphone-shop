import { expectError, expectStatus, type ApiProduct, type ProductPage } from "../../src/api/ApiClient";
import { CATEGORY_VALUES, productContract } from "../../src/api/contracts";
import { CATALOG, PRODUCTS } from "../../src/data/test-data";
import { expect, test } from "../../src/fixtures";

test.describe("Products API", () => {
  test("lists the first page of active products @smoke", async ({ api }) => {
    const body = await expectStatus<ProductPage>(await api.listProducts(), 200);

    expect(body).toEqual({ items: expect.any(Array), page: 1, pageSize: 20, total: CATALOG.totalProducts });
    expect(body.items).toHaveLength(20);
    for (const product of body.items) expect(product).toEqual(productContract());
  });

  test("pages are disjoint and the last page holds the remainder", async ({ api }) => {
    const pages = await Promise.all(
      [1, 2, 3, 4].map(async (page) => expectStatus<ProductPage>(await api.listProducts({ page, pageSize: 30 }), 200)),
    );

    expect(pages.map((p) => p.items.length)).toEqual([30, 30, 30, 10]);
    const ids = pages.flatMap((p) => p.items.map((item) => item.id));
    expect(new Set(ids).size).toBe(CATALOG.totalProducts);
  });

  test("a page past the end is empty", async ({ api }) => {
    const body = await expectStatus<ProductPage>(await api.listProducts({ page: 99 }), 200);

    expect(body.items).toEqual([]);
    expect(body.total).toBe(CATALOG.totalProducts);
  });

  for (const [category, count] of Object.entries(CATALOG.categories)) {
    test(`filters by category: ${category}`, async ({ api }) => {
      const body = await expectStatus<ProductPage>(await api.listProducts({ category, pageSize: 100 }), 200);

      expect(body.total).toBe(count);
      expect(body.items.every((item) => item.category === category)).toBe(true);
    });
  }

  test("search is case-insensitive", async ({ api }) => {
    const body = await expectStatus<ProductPage>(await api.listProducts({ q: "IPHONE", pageSize: 100 }), 200);

    expect(body.total).toBe(CATALOG.iphoneMatches);
    for (const item of body.items) expect(item.name.toLowerCase()).toContain("iphone");
  });

  test("treats SQL wildcards in the search term literally", async ({ api }) => {
    for (const q of ["%", "_", "\\"]) {
      const body = await expectStatus<ProductPage>(await api.listProducts({ q }), 200);
      expect(body.total, `q=${q}`).toBe(0);
    }
  });

  const invalidQueries = [
    { params: { category: "tablet" }, field: "category" },
    { params: { page: 0 }, field: "page" },
    { params: { page: "abc" }, field: "page" },
    { params: { pageSize: 0 }, field: "pageSize" },
    { params: { pageSize: 101 }, field: "pageSize" },
    { params: { q: "x".repeat(101) }, field: "q" },
  ];
  for (const { params, field } of invalidQueries) {
    test(`rejects invalid query ${JSON.stringify(params).slice(0, 40)} with 422`, async ({ api }) => {
      const error = await expectError(await api.listProducts(params), 422, "validation_error");

      expect(error.details?.map((detail) => detail.field)).toEqual([field]);
    });
  }

  test("returns product details that match the database", async ({ api, db }) => {
    const seeded = await db.getProductByName(PRODUCTS.smartphone);

    const product = await expectStatus<ApiProduct>(await api.getProduct(seeded.id), 200);

    expect(product).toEqual(productContract());
    expect(product).toMatchObject({
      id: seeded.id,
      name: PRODUCTS.smartphone,
      category: "smartphone",
      price: { amount: seeded.priceCents / 100, currency: "EUR" },
      availability: "in_stock",
    });
    expect(product.images[0]).toMatch(/^\/products\/phones\/.+\.(webp|svg)$/);
  });

  test("reports out-of-stock availability", async ({ api, db }) => {
    const seeded = await db.getProductByName(PRODUCTS.outOfStock);

    const product = await expectStatus<ApiProduct>(await api.getProduct(seeded.id), 200);

    expect(product.availability).toBe("out_of_stock");
  });

  // Titles must be stable across workers, so no random ids here.
  const unknownIds = { "unknown uuid": "3f1c2a7e-9b4d-4c3e-8f00-000000000000", "malformed id": "not-a-uuid", "SQL injection": "1' OR '1'='1" };
  for (const [label, id] of Object.entries(unknownIds)) {
    test(`${label} returns 404`, async ({ api }) => {
      await expectError(await api.getProduct(id), 404, "not_found");
    });
  }

  test("lists categories", async ({ api }) => {
    expect(await expectStatus(await api.categories(), 200)).toEqual([...CATEGORY_VALUES]);
  });
});
