import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class OrderPage extends BasePage {
  readonly confirmation: Locator;
  readonly heading: Locator;
  readonly orderNumber: Locator;
  readonly status: Locator;
  readonly items: Locator;
  readonly subtotal: Locator;
  readonly delivery: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly address: Locator;

  constructor(page: Page) {
    super(page);
    this.confirmation = page.getByTestId("order-confirmation");
    this.heading = page.getByTestId("order-heading");
    this.orderNumber = page.getByTestId("order-number");
    this.status = page.getByTestId("order-status");
    this.items = page.getByTestId("order-item");
    this.subtotal = page.getByTestId("order-subtotal");
    this.delivery = page.getByTestId("order-delivery");
    this.tax = page.getByTestId("order-tax");
    this.total = page.getByTestId("order-total");
    this.address = page.getByTestId("order-address");
  }

  async goto(orderId: string) {
    return this.page.goto(`/orders/${orderId}`);
  }

  /** Waits for the confirmation page and returns the order id from the URL. */
  async waitForOrder(): Promise<string> {
    await expect(this.page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
    await expect(this.confirmation).toBeVisible();
    return (await this.confirmation.getAttribute("data-order-id"))!;
  }

  item(productName: string): Locator {
    return this.items.filter({ has: this.page.getByTestId("order-item-name").getByText(productName, { exact: true }) });
  }
}
