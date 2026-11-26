import type { z } from "zod";
import { getCart, type Cart, type CartResult } from "./cart";
import { centsToAmount } from "./money";
import type { OrderDetails } from "./orders";
import type { Product } from "./products";
import { getSessionUser, type SessionUser } from "./session";

export type ApiErrorDetail = { field: string; issue: string };

/** Error body from docs/openapi.yaml (components/schemas/Error). */
export function apiError(status: number, code: string, message: string, details?: ApiErrorDetail[]): Response {
  return Response.json({ code, message, ...(details && { details }) }, { status });
}

export function validationError(error: z.ZodError): Response {
  const details = error.issues.map((issue) => ({ field: issue.path.join(".") || "body", issue: issue.message }));
  return apiError(422, "validation_error", "Validation failed.", details);
}

export const notFound = (message = "Not found.") => apiError(404, "not_found", message);

/**
 * Parses a JSON body. Requiring application/json also blocks cross-site HTML form posts,
 * which cannot send that content type without a CORS preflight.
 */
export async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false, response: apiError(415, "unsupported_media_type", "Content-Type must be application/json.") };
  }
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, response: apiError(400, "invalid_json", "Request body is not valid JSON.") };
  }
}

export async function requireApiUser(): Promise<{ ok: true; user: SessionUser } | { ok: false; response: Response }> {
  const user = await getSessionUser();
  return user ? { ok: true, user } : { ok: false, response: apiError(401, "unauthorized", "Log in first.") };
}

export function money(cents: number) {
  return { amount: Number(centsToAmount(cents)), currency: "EUR" };
}

export function productJson(product: Product) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: money(product.priceCents),
    rating: product.rating,
    availability: product.availability,
    images: product.imageUrl ? [product.imageUrl] : [],
  };
}

export function cartJson(cart: Cart) {
  return {
    items: cart.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      brand: item.brand,
      quantity: item.quantity,
      unitPrice: money(item.unitPriceCents),
      lineTotal: money(item.lineTotalCents),
      available: item.isAvailable,
    })),
    itemCount: cart.itemCount,
    total: money(cart.subtotalCents),
  };
}

const CART_ERROR_STATUS = {
  not_found: 404,
  not_in_cart: 404,
  out_of_stock: 409,
  insufficient_stock: 409,
  quantity_limit: 422,
} as const;

/** Error response for a failed cart change, otherwise the updated cart. */
export async function cartResponse(userId: string, result: CartResult): Promise<Response> {
  if (!result.ok) return apiError(CART_ERROR_STATUS[result.code], result.code, result.error);
  return Response.json(cartJson(await getCart(userId)));
}

export function orderJson(order: OrderDetails) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    deliveryMethod: order.deliveryMethod,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: money(item.unitPriceCents),
      lineTotal: money(item.lineTotalCents),
    })),
    subtotal: money(order.subtotalCents),
    tax: money(order.taxCents),
    delivery: money(order.shippingCents),
    total: money(order.totalCents),
    address: order.address,
    createdAt: order.createdAt.toISOString(),
  };
}
