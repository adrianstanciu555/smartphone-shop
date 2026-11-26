import { expect, type Locator, type Page } from "@playwright/test";
import type { Address, Payment } from "../data/test-data";
import { BasePage } from "./BasePage";

export type CheckoutField =
  | "recipient" | "phone" | "line1" | "line2" | "city" | "postalCode" | "country"
  | "cardName" | "cardNumber" | "expiry" | "cvc";

export type DeliveryMethod = "standard" | "express";

export class CheckoutPage extends BasePage {
  readonly heading: Locator;
  readonly items: Locator;
  readonly formError: Locator;
  readonly summarySubtotal: Locator;
  readonly summaryDelivery: Locator;
  readonly summaryTotal: Locator;
  readonly payButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Checkout" });
    this.items = page.getByTestId("checkout-item");
    this.formError = page.getByTestId("checkout-error");
    this.summarySubtotal = page.getByTestId("summary-subtotal");
    this.summaryDelivery = page.getByTestId("summary-delivery");
    this.summaryTotal = page.getByTestId("summary-total");
    this.payButton = page.getByTestId("place-order-button");
  }

  async goto(): Promise<void> {
    await this.page.goto("/checkout");
  }

  field(name: CheckoutField): Locator {
    return this.page.getByTestId(`checkout-${name}`);
  }

  fieldError(name: CheckoutField | "deliveryMethod"): Locator {
    return this.page.getByTestId(`checkout-${name}-error`);
  }

  deliveryOption(method: DeliveryMethod): Locator {
    return this.page.getByTestId(`delivery-${method}`);
  }

  async fillAddress(address: Address): Promise<void> {
    await this.field("recipient").fill(address.recipient);
    await this.field("phone").fill(address.phone);
    await this.field("line1").fill(address.line1);
    await this.field("line2").fill(address.line2 ?? "");
    await this.field("city").fill(address.city);
    await this.field("postalCode").fill(address.postalCode);
    await this.field("country").fill(address.country);
  }

  async chooseDelivery(method: DeliveryMethod): Promise<void> {
    await this.deliveryOption(method).check();
  }

  async fillPayment(payment: Payment): Promise<void> {
    await this.field("cardName").fill(payment.cardName);
    await this.field("cardNumber").fill(payment.cardNumber);
    await this.field("expiry").fill(payment.expiry);
    await this.field("cvc").fill(payment.cvc);
  }

  /** Submits the order; the dummy provider adds ~800 ms latency while the button shows a pending state. */
  async pay(): Promise<void> {
    await this.submitServerAction(this.payButton);
  }

  async placeOrder(address: Address, payment: Payment, delivery: DeliveryMethod = "standard"): Promise<void> {
    await this.fillAddress(address);
    await this.chooseDelivery(delivery);
    await this.fillPayment(payment);
    await this.pay();
  }

  async expectSummary(totals: { subtotal: string; delivery: string; total: string }): Promise<void> {
    await expect(this.summarySubtotal).toHaveText(totals.subtotal);
    await expect(this.summaryDelivery).toHaveText(totals.delivery);
    await expect(this.summaryTotal).toHaveText(totals.total);
  }
}
