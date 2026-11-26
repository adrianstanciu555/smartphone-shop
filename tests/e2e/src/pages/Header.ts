import { expect, type Locator, type Page } from "@playwright/test";

/** Site header, rendered on every page. */
export class Header {
  readonly cartLink: Locator;
  readonly cartCount: Locator;
  readonly userName: Locator;
  readonly loginLink: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.cartLink = page.getByTestId("nav-cart");
    this.cartCount = page.getByTestId("cart-count");
    this.userName = page.getByTestId("user-name");
    this.loginLink = page.getByTestId("nav-login");
    this.logoutButton = page.getByTestId("logout-button");
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await expect(this.page).toHaveURL(/\/login$/);
    await expect(this.loginLink).toBeVisible();
  }

  async expectCartCount(count: number): Promise<void> {
    await expect(this.cartCount).toHaveText(String(count));
  }
}
