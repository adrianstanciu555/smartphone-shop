import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ProductPage extends BasePage {
  readonly details: Locator;
  readonly title: Locator;
  readonly brand: Locator;
  readonly sku: Locator;
  readonly price: Locator;
  readonly availability: Locator;
  readonly quantitySelect: Locator;
  readonly addToCartButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly backToCatalog: Locator;

  constructor(page: Page) {
    super(page);
    this.details = page.getByTestId("product-details");
    this.title = page.getByTestId("product-title");
    this.brand = page.getByTestId("product-brand");
    this.sku = page.getByTestId("product-sku");
    this.price = this.details.getByTestId("product-price");
    this.availability = this.details.getByTestId("product-availability");
    this.quantitySelect = page.getByLabel("Quantity");
    this.addToCartButton = page.getByTestId("add-to-cart-button");
    this.successMessage = page.getByTestId("add-to-cart-success");
    this.errorMessage = page.getByTestId("add-to-cart-error");
    this.backToCatalog = page.getByTestId("back-to-catalog");
  }

  async goto(productId: string) {
    return this.page.goto(`/product/${productId}`);
  }

  /** Submits the add-to-cart form; assert on successMessage / errorMessage afterwards. */
  async addToCart(quantity = 1): Promise<void> {
    await this.quantitySelect.selectOption(String(quantity));
    await this.submitServerAction(this.addToCartButton);
  }
}
