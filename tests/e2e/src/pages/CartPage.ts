import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/** One row in the cart, scoped by product name. */
export class CartItem extends BasePage {
  readonly name: Locator;
  readonly unitPrice: Locator;
  readonly quantityInput: Locator;
  readonly updateButton: Locator;
  readonly removeButton: Locator;
  readonly lineTotal: Locator;
  readonly error: Locator;
  readonly stockWarning: Locator;

  constructor(page: Page, readonly root: Locator) {
    super(page);
    this.name = root.getByTestId("cart-item-name");
    this.unitPrice = root.getByTestId("cart-item-unit-price");
    this.quantityInput = root.getByTestId("cart-item-quantity");
    this.updateButton = root.getByTestId("cart-item-update");
    this.removeButton = root.getByTestId("cart-item-remove");
    this.lineTotal = root.getByTestId("cart-item-line-total");
    this.error = root.getByTestId("cart-item-error");
    this.stockWarning = root.getByTestId("cart-item-stock-warning");
  }

  async updateQuantity(quantity: number): Promise<void> {
    await this.quantityInput.fill(String(quantity));
    await this.submitServerAction(this.updateButton);
  }

  async remove(): Promise<void> {
    await this.submitServerAction(this.removeButton);
    await expect(this.root).toBeHidden();
  }
}

export class CartPage extends BasePage {
  readonly heading: Locator;
  readonly items: Locator;
  readonly subtotal: Locator;
  readonly emptyState: Locator;
  readonly checkoutButton: Locator;
  readonly continueShopping: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Your cart" });
    this.items = page.getByTestId("cart-item");
    this.subtotal = page.getByTestId("cart-subtotal");
    this.emptyState = page.getByTestId("cart-empty");
    this.checkoutButton = page.getByTestId("checkout-button");
    this.continueShopping = page.getByTestId("continue-shopping");
  }

  async goto(): Promise<void> {
    await this.page.goto("/cart");
    await expect(this.heading).toBeVisible();
  }

  item(productName: string): CartItem {
    return new CartItem(this.page, this.items.filter({ has: this.page.getByTestId("cart-item-name").getByText(productName, { exact: true }) }));
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/\/checkout$/);
  }
}
