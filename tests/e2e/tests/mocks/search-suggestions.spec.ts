import { CATALOG, PRODUCTS } from "../../src/data/test-data";
import { expect, test } from "../../src/fixtures";
import { fakeProduct, ProductsApiMock } from "../../src/mocks/ProductsApiMock";
import { formatEur } from "../../src/utils/money";

/*
 * The catalog search box asks GET /api/v1/products for live suggestions from the browser.
 * These tests replace that API with page.route() so the UI can be checked against data and
 * failures the real backend cannot easily produce.
 */
test.describe("Search suggestions (mocked API)", () => {
  test("renders suggestions from the API response", async ({ page, catalogPage }) => {
    const mock = await ProductsApiMock.respondWith(page, [
      fakeProduct({ name: "Mockphone X 1TB", price: { amount: 1999.99, currency: "EUR" } }),
      fakeProduct({ name: "Mockphone X Case", category: "case", price: { amount: 9.5, currency: "EUR" } }),
    ]);
    await catalogPage.goto();

    await catalogPage.typeSearch("mockphone");

    await expect(catalogPage.suggestionNames).toHaveText(["Mockphone X 1TB", "Mockphone X Case"]);
    await expect(catalogPage.suggestionPrices).toHaveText([formatEur(199999), formatEur(950)]);
    // The server-rendered list is not affected by the mock.
    await expect(catalogPage.productCards).toHaveCount(CATALOG.totalProducts);
    expect(mock.requests.at(-1)?.searchParams.get("q")).toBe("mockphone");
  });

  test("sends a debounced request with the trimmed term and a page size of 5", async ({ page, catalogPage }) => {
    const mock = await ProductsApiMock.respondWith(page, [fakeProduct()]);
    await catalogPage.goto();

    await catalogPage.searchInput.pressSequentially("  pixel ", { delay: 20 });
    await expect(catalogPage.suggestions).toHaveCount(1);

    expect(mock.requests).toHaveLength(1);
    expect(Object.fromEntries(mock.requests[0].searchParams)).toEqual({ q: "pixel", pageSize: "5" });
  });

  test("does not call the API for fewer than 2 characters", async ({ page, catalogPage }) => {
    const mock = await ProductsApiMock.respondWith(page, [fakeProduct()]);
    await catalogPage.goto();

    await catalogPage.typeSearch("p");
    // No UI change to wait for when nothing happens; give the 250 ms debounce time to fire.
    await page.waitForTimeout(600);

    expect(mock.requests).toHaveLength(0);
    await expect(catalogPage.suggestions).toHaveCount(0);
  });

  test("shows an empty state when the API returns no products", async ({ page, catalogPage }) => {
    await ProductsApiMock.respondWith(page, []);
    await catalogPage.goto();

    await catalogPage.typeSearch("nothing");

    await expect(catalogPage.suggestionsEmpty).toHaveText("No suggestions.");
  });

  test("shows a loading indicator while the API is slow", async ({ page, catalogPage }) => {
    const { release } = await ProductsApiMock.held(page, [fakeProduct({ name: "Slowphone" })]);
    await catalogPage.goto();

    await catalogPage.typeSearch("slow");
    await expect(catalogPage.suggestionsLoading).toBeVisible();
    release();

    await expect(catalogPage.suggestionsLoading).toBeHidden();
    await expect(catalogPage.suggestionNames).toHaveText(["Slowphone"]);
  });

  for (const status of [500, 503, 429]) {
    test(`degrades gracefully on HTTP ${status} and the normal search still works`, async ({ page, catalogPage }) => {
      await ProductsApiMock.failWith(page, status);
      await catalogPage.goto();

      await catalogPage.typeSearch("iphone");

      await expect(catalogPage.suggestionsError).toHaveText("Suggestions are unavailable. Press Apply to search.");
      await catalogPage.applyButton.click();
      await catalogPage.expectResultsCount(CATALOG.iphoneMatches);
    });
  }

  test("degrades gracefully when the network fails", async ({ page, catalogPage }) => {
    await ProductsApiMock.abort(page);
    await catalogPage.goto();

    await catalogPage.typeSearch("iphone");

    await expect(catalogPage.suggestionsError).toBeVisible();
  });

  test("shows a real API response modified by the test", async ({ page, catalogPage }) => {
    await ProductsApiMock.patchRealResponse(page, (body) => ({
      ...body,
      items: body.items.map((item, index) => (index === 0 ? { ...item, name: `${item.name} (Black Friday)`, price: { amount: 1, currency: "EUR" } } : item)),
    }));
    await catalogPage.goto();

    await catalogPage.typeSearch("pixel 8");

    await expect(catalogPage.suggestions).toHaveCount(5);
    await expect(catalogPage.suggestionNames.first()).toHaveText(/\(Black Friday\)$/);
    await expect(catalogPage.suggestionPrices.first()).toHaveText(formatEur(100));
  });

  test("a suggestion links to its product page", async ({ page, catalogPage, productPage, db }) => {
    const real = await db.getProductByName(PRODUCTS.smartphone);
    await ProductsApiMock.respondWith(page, [fakeProduct({ id: real.id, name: "Mocked name for a real id" })]);
    await catalogPage.goto();

    await catalogPage.typeSearch("pixel");
    await catalogPage.suggestions.first().getByRole("link").click();

    await expect(page).toHaveURL(`/product/${real.id}`);
    await expect(productPage.title).toHaveText(real.name);
  });

  test("renders untrusted product names as text, not HTML", async ({ page, catalogPage }) => {
    const payload = `<img src=x onerror="window.__xss=1">Evil phone`;
    await ProductsApiMock.respondWith(page, [fakeProduct({ name: payload })]);
    await catalogPage.goto();

    await catalogPage.typeSearch("evil");

    await expect(catalogPage.suggestionNames).toHaveText(payload);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});
