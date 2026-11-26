import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export type CategoryLabel = "All categories" | "Smartphones" | "Cases" | "Chargers" | "Cables" | "Headphones" | "Screen protectors";

export class CatalogPage extends BasePage {
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly applyButton: Locator;
  readonly clearFiltersLink: Locator;
  readonly resultsCount: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly noResults: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByRole("searchbox", { name: "Search" });
    this.categorySelect = page.getByLabel("Category");
    this.applyButton = page.getByTestId("search-button");
    this.clearFiltersLink = page.getByTestId("clear-filters");
    this.resultsCount = page.getByTestId("results-count");
    this.productCards = page.getByTestId("product-card");
    this.productNames = page.getByTestId("product-name");
    this.noResults = page.getByTestId("no-results");
  }

  async goto(filters: { q?: string; category?: string } = {}): Promise<void> {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value) as [string, string][]);
    await this.page.goto(`/catalog${params.size ? `?${params}` : ""}`);
  }

  async search(query: string, category: CategoryLabel = "All categories"): Promise<void> {
    await this.searchInput.fill(query);
    await this.categorySelect.selectOption({ label: category });
    await this.applyButton.click();
    await expect(this.page).toHaveURL(/\/catalog\?/);
  }

  card(productName: string): Locator {
    return this.productCards.filter({ has: this.page.getByTestId("product-name").getByText(productName, { exact: true }) });
  }

  async openProduct(productName: string): Promise<void> {
    await this.card(productName).getByTestId("product-name").click();
    await expect(this.page).toHaveURL(/\/product\//);
  }

  async expectResultsCount(count: number): Promise<void> {
    await expect(this.resultsCount).toHaveText(`${count} product${count === 1 ? "" : "s"}`);
    await expect(this.productCards).toHaveCount(count);
  }
}
