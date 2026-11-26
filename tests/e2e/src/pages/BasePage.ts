import type { Locator, Page, Response } from "@playwright/test";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Clicks a submit button of a Next.js Server Action form and waits for the action response.
   * Assertions afterwards still use web-first `expect` because React applies the result asynchronously.
   */
  protected async submitServerAction(button: Locator): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => res.request().method() === "POST" && !!res.request().headers()["next-action"]),
      button.click(),
    ]);
    return response;
  }
}
