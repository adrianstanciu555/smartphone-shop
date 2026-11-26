import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import type { Customer } from "../data/test-data";

export type Money = { amount: number; currency: "EUR" };

export type ApiProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: Money;
  rating: number;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  images: string[];
};

export type ProductPage = { items: ApiProduct[]; page: number; pageSize: number; total: number };

export type ApiCartItem = {
  productId: string;
  name: string;
  brand: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  available: boolean;
};

export type ApiCart = { items: ApiCartItem[]; itemCount: number; total: Money };

export type ApiOrder = {
  id: string;
  number: string;
  status: string;
  deliveryMethod: "standard" | "express";
  items: { productId: string; name: string; quantity: number; unitPrice: Money; lineTotal: Money }[];
  subtotal: Money;
  tax: Money;
  delivery: Money;
  total: Money;
  address: Record<string, string>;
  createdAt: string;
};

export type ApiError = { code: string; message: string; details?: { field: string; issue: string }[]; orderId?: string };

export type CheckoutBody = {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
  deliveryMethod: "standard" | "express";
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
};

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type SendOptions = { data?: unknown; params?: Record<string, string | number>; headers?: Record<string, string> };

const SECRET_FIELDS = new Set(["password", "cardNumber", "cvc"]);

function redact(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, SECRET_FIELDS.has(key) ? "***" : value]));
}

function parseBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Thin wrapper over the app's REST API (/api/v1). Methods return the raw response so tests can assert errors.
 * Each call is a report step with the request and response attached (secrets redacted) for Allure and the HTML report.
 */
export class ApiClient {
  constructor(readonly request: APIRequestContext) {}

  private send(method: Method, url: string, options: SendOptions = {}): Promise<APIResponse> {
    return test.step(
      `${method} ${url}`,
      async () => {
        const response = await this.request.fetch(url, { method, ...options });
        const exchange = {
          request: { method, url: response.url(), headers: options.headers, params: options.params, body: redact(options.data) },
          response: { status: response.status(), body: parseBody(await response.text()) },
        };
        await test.info().attach(`${method} ${url} -> ${response.status()}`, {
          body: JSON.stringify(exchange, null, 2),
          contentType: "application/json",
        });
        return response;
      },
      { box: true },
    );
  }

  login(customer: Pick<Customer, "email" | "password">): Promise<APIResponse> {
    return this.send("POST", "/api/v1/auth/login", { data: { email: customer.email, password: customer.password } });
  }

  logout(): Promise<APIResponse> {
    return this.send("POST", "/api/v1/auth/logout");
  }

  me(): Promise<APIResponse> {
    return this.send("GET", "/api/v1/users/me");
  }

  listProducts(params: { q?: string; category?: string; page?: number | string; pageSize?: number | string } = {}): Promise<APIResponse> {
    return this.send("GET", "/api/v1/products", { params: params as Record<string, string | number> });
  }

  getProduct(id: string): Promise<APIResponse> {
    return this.send("GET", `/api/v1/products/${encodeURIComponent(id)}`);
  }

  categories(): Promise<APIResponse> {
    return this.send("GET", "/api/v1/categories");
  }

  getCart(): Promise<APIResponse> {
    return this.send("GET", "/api/v1/cart");
  }

  clearCart(): Promise<APIResponse> {
    return this.send("DELETE", "/api/v1/cart");
  }

  addCartItem(productId: string, quantity: unknown = 1): Promise<APIResponse> {
    return this.send("POST", "/api/v1/cart/items", { data: { productId, quantity } });
  }

  updateCartItem(productId: string, quantity: unknown): Promise<APIResponse> {
    return this.send("PATCH", `/api/v1/cart/items/${encodeURIComponent(productId)}`, { data: { quantity } });
  }

  removeCartItem(productId: string): Promise<APIResponse> {
    return this.send("DELETE", `/api/v1/cart/items/${encodeURIComponent(productId)}`);
  }

  checkout(body: Partial<CheckoutBody>, idempotencyKey?: string): Promise<APIResponse> {
    return this.send("POST", "/api/v1/checkout", {
      data: body,
      headers: idempotencyKey === undefined ? undefined : { "Idempotency-Key": idempotencyKey },
    });
  }

  getOrder(id: string): Promise<APIResponse> {
    return this.send("GET", `/api/v1/orders/${encodeURIComponent(id)}`);
  }
}

/** Asserts the status (printing the body on mismatch) and returns the parsed JSON body. */
export async function expectStatus<T = unknown>(response: APIResponse, status: number): Promise<T> {
  const text = await response.text();
  // The message is also the report step name, so the body is only added when the assertion fails.
  const body = response.status() === status ? "" : ` - responded with: ${text}`;
  expect(response.status(), `HTTP status of ${new URL(response.url()).pathname}${body}`).toBe(status);
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Asserts an error response in the docs/openapi.yaml Error format and returns it. */
export async function expectError(response: APIResponse, status: number, code: string): Promise<ApiError> {
  const body = await expectStatus<ApiError>(response, status);
  expect(body).toMatchObject({ code, message: expect.any(String) });
  return body;
}
