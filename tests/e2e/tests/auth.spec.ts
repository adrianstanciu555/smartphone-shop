import { expect, test } from "../src/fixtures";

test.describe("Authentication", () => {
  test("first login with a new email creates the account and signs in @smoke", async ({ loginPage, header, customer, db, page }) => {
    await loginPage.goto();
    await loginPage.loginAs(customer);

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(header.logoutButton).toBeVisible();
    expect(await db.userExists(customer.email)).toBe(true);
  });

  test("existing account with a wrong password shows an error", async ({ loginPage, header, signedInCustomer }) => {
    await header.logout();

    await loginPage.submit(signedInCustomer.email, "WrongPassword1");

    await expect(loginPage.formError).toHaveText("Invalid email or password.");
    await expect(loginPage.emailInput).toHaveValue(signedInCustomer.email);
    await expect(loginPage.passwordInput).toHaveValue("");
    await expect(header.loginLink).toBeVisible();
  });

  test("returning customer can log in again with the same password", async ({ loginPage, header, signedInCustomer }) => {
    await header.logout();

    await loginPage.loginAs(signedInCustomer);
  });

  test("email is matched case-insensitively", async ({ loginPage, header, signedInCustomer }) => {
    await header.logout();

    await loginPage.loginAs({ ...signedInCustomer, email: signedInCustomer.email.toUpperCase() });
  });

  test("shows field validation errors", async ({ loginPage }) => {
    await loginPage.goto();

    await loginPage.submit("not-an-email", "");

    await expect(loginPage.emailError).toHaveText("Enter a valid email address.");
    await expect(loginPage.passwordError).toHaveText("Password is required.");
    await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "true");
  });

  test("redirects back to the requested page after login", async ({ page, loginPage, customer }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/login\?next=%2Fcart$/);

    await loginPage.loginAs(customer);

    await expect(page).toHaveURL(/\/cart$/);
  });

  test("ignores external return URLs (open redirect)", async ({ page, loginPage, customer }) => {
    await loginPage.goto("//evil.example.com");

    await loginPage.loginAs(customer);

    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/catalog$/);
  });

  test("logout ends the session", async ({ page, header, signedInCustomer }) => {
    void signedInCustomer;
    await header.logout();

    await page.goto("/cart");
    await expect(page).toHaveURL(/\/login\?next=%2Fcart$/);
  });
});
