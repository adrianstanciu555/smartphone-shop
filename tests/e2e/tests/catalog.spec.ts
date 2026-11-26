import { CATALOG, PRODUCTS } from "../src/data/test-data";
import { expect, test } from "../src/fixtures";
import { formatEur } from "../src/utils/money";

test.describe("Catalog", () => {
  test("lists all active products for anonymous visitors @smoke", async ({ catalogPage, header, page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(page).toHaveTitle("Catalog | Smartphone Shop");
    await catalogPage.expectResultsCount(CATALOG.totalProducts);
    await expect(header.loginLink).toBeVisible();
    await expect(header.cartCount).toHaveText("0");
  });

  test("searches products by name", async ({ catalogPage, page }) => {
    await catalogPage.goto();

    await catalogPage.search("iphone");

    await expect(page).toHaveURL(/q=iphone/);
    await catalogPage.expectResultsCount(CATALOG.iphoneMatches);
    for (const name of await catalogPage.productNames.allTextContents()) {
      expect(name.toLowerCase()).toContain("iphone");
    }
  });

  test("filters products by category", async ({ catalogPage, page }) => {
    await catalogPage.goto();

    await catalogPage.search("", "Cables");

    await expect(page).toHaveURL(/category=cable/);
    await catalogPage.expectResultsCount(CATALOG.categories.cable);
    await expect(catalogPage.categorySelect).toHaveValue("cable");
  });

  test("combines search and category filters", async ({ catalogPage }) => {
    await catalogPage.goto();

    await catalogPage.search("iPhone 15", "Cases");

    await catalogPage.expectResultsCount(7);
    await expect(catalogPage.card(PRODUCTS.iphoneCase)).toBeVisible();
    for (const name of await catalogPage.productNames.allTextContents()) {
      expect(name).toMatch(/Case for iPhone 15$/);
    }
  });

  test("shows an empty state when nothing matches and can clear filters", async ({ catalogPage, page }) => {
    await catalogPage.goto({ q: "no-such-phone-xyz" });

    await expect(catalogPage.noResults).toHaveText("No products match your search.");
    await expect(catalogPage.resultsCount).toHaveText("0 products");

    await catalogPage.clearFiltersLink.click();

    await expect(page).toHaveURL(/\/catalog$/);
    await catalogPage.expectResultsCount(CATALOG.totalProducts);
  });

  test("treats SQL wildcards in the search term literally", async ({ catalogPage }) => {
    await catalogPage.goto({ q: "%" });

    await expect(catalogPage.noResults).toBeVisible();
  });

  test("ignores an unknown category value", async ({ catalogPage }) => {
    await catalogPage.goto({ category: "spaceships" });

    await catalogPage.expectResultsCount(CATALOG.totalProducts);
  });

  test("opens the product details page from the list", async ({ catalogPage, productPage, page, db }) => {
    const product = await db.getProductByName(PRODUCTS.smartphone);
    await catalogPage.goto({ q: PRODUCTS.smartphone });

    await catalogPage.openProduct(PRODUCTS.smartphone);

    await expect(page).toHaveURL(`/product/${product.id}`);
    await expect(page).toHaveTitle(`${PRODUCTS.smartphone} | Smartphone Shop`);
    await expect(productPage.title).toHaveText(PRODUCTS.smartphone);
    await expect(productPage.price).toHaveText(formatEur(product.priceCents));
    await expect(productPage.availability).toHaveText("In stock");
    await expect(productPage.addToCartButton).toBeEnabled();
  });

  test("out-of-stock products cannot be added to the cart", async ({ productPage, db }) => {
    const product = await db.getProductByName(PRODUCTS.outOfStock);

    await productPage.goto(product.id);

    await expect(productPage.availability).toHaveText("Out of stock");
    await expect(productPage.addToCartButton).toBeDisabled();
    await expect(productPage.addToCartButton).toHaveText("Out of stock");
    await expect(productPage.quantitySelect).toBeDisabled();
  });

  test("unknown product ids return 404", async ({ productPage }) => {
    const notUuid = await productPage.goto("not-a-uuid");
    expect(notUuid?.status()).toBe(404);

    const missing = await productPage.goto("00000000-0000-0000-0000-000000000000");
    expect(missing?.status()).toBe(404);
  });
});
