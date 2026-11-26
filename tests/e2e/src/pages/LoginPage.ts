import { expect, type Locator, type Page } from "@playwright/test";
import type { Customer } from "../data/test-data";
import { BasePage } from "./BasePage";
import { Header } from "./Header";

export class LoginPage extends BasePage {
  readonly header: Header;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly formError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByTestId("login-submit");
    this.formError = page.getByTestId("login-error");
    this.emailError = page.getByTestId("login-email-error");
    this.passwordError = page.getByTestId("login-password-error");
  }

  async goto(next?: string): Promise<void> {
    await this.page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }

  async submit(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Logs in (registering the account on first use) and waits until the header shows the user. */
  async loginAs(customer: Customer): Promise<void> {
    await this.submit(customer.email, customer.password);
    // Password hashing (argon2) on first login is CPU-bound and slows down under parallel workers.
    await expect(this.header.userName).toHaveText(customer.name, { timeout: 20_000 });
  }
}
