import { randomUUID } from "node:crypto";
import type { APIResponse } from "@playwright/test";
import { expectError, expectStatus, type ApiClient } from "../../src/api/ApiClient";
import { userContract } from "../../src/api/contracts";
import { checkoutBody } from "../../src/data/test-data";
import { expect, test } from "../../src/fixtures";

test.describe("Auth API", () => {
  test("first login registers the customer and sets an HttpOnly session cookie @smoke", async ({ api, customer, db }) => {
    const response = await api.login({ ...customer, email: customer.email.toUpperCase() });

    const body = await expectStatus<{ user: unknown }>(response, 200);
    // toEqual fails on extra fields, so this also proves no password hash or role leaks.
    expect(body).toEqual({ user: userContract(customer.email) });
    const cookie = response.headersArray().find((h) => h.name.toLowerCase() === "set-cookie" && h.value.startsWith("session="));
    expect(cookie?.value).toMatch(/HttpOnly/i);
    expect(cookie?.value).toMatch(/SameSite=lax/i);
    expect(await db.userExists(customer.email)).toBe(true);
  });

  test("GET /users/me returns the logged-in customer", async ({ customerApi, customer }) => {
    expect(await expectStatus(await customerApi.me(), 200)).toEqual(userContract(customer.email));
  });

  test("wrong password for an existing account returns 401", async ({ api, newCustomerApi, customer }) => {
    await newCustomerApi(customer);

    const error = await expectError(await api.login({ ...customer, password: "Wrong123!" }), 401, "invalid_credentials");

    expect(error.message).toBe("Invalid email or password.");
    await expectError(await api.me(), 401, "unauthorized");
  });

  test("invalid login body returns 422 with a detail per field", async ({ api }) => {
    const error = await expectError(await api.login({ email: "not-an-email", password: "" }), 422, "validation_error");

    expect(error.details?.map((d) => d.field).sort()).toEqual(["email", "password"]);
  });

  test("non-JSON request bodies are rejected with 415", async ({ request, customer }) => {
    const response = await request.post("/api/v1/auth/login", { form: { email: customer.email, password: customer.password } });

    await expectError(response, 415, "unsupported_media_type");
  });

  test("malformed JSON returns 400", async ({ request }) => {
    // A Buffer is sent as-is; a string would be JSON-encoded by Playwright into a valid JSON string.
    const response = await request.post("/api/v1/auth/login", {
      data: Buffer.from("{\"email\":"),
      headers: { "Content-Type": "application/json" },
    });

    await expectError(response, 400, "invalid_json");
  });

  test("logout ends the session", async ({ customerApi }) => {
    await expectStatus(await customerApi.logout(), 204);

    await expectError(await customerApi.me(), 401, "unauthorized");
  });

  test("a forged session cookie is rejected", async ({ request }) => {
    const forged = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.c2lnbmF0dXJl";

    const response = await request.get("/api/v1/users/me", { headers: { Cookie: `session=${forged}` } });

    await expectError(response, 401, "unauthorized");
  });

  const protectedEndpoints: { name: string; call: (api: ApiClient) => Promise<APIResponse> }[] = [
    { name: "GET /users/me", call: (api) => api.me() },
    { name: "GET /cart", call: (api) => api.getCart() },
    { name: "DELETE /cart", call: (api) => api.clearCart() },
    { name: "POST /cart/items", call: (api) => api.addCartItem(randomUUID(), 1) },
    { name: "POST /checkout", call: (api) => api.checkout(checkoutBody(), randomUUID()) },
    { name: "GET /orders/{id}", call: (api) => api.getOrder(randomUUID()) },
  ];
  for (const { name, call } of protectedEndpoints) {
    test(`${name} requires a session`, async ({ api }) => {
      await expectError(await call(api), 401, "unauthorized");
    });
  }
});
