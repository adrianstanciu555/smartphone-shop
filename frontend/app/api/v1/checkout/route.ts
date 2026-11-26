import { z } from "zod";
import { apiError, readJson, requireApiUser, validationError } from "@/lib/api";
import { checkoutSchema, toPlaceOrderInput } from "@/lib/checkout-schema";
import { placeOrder } from "@/lib/orders";

const ERROR_STATUS = { payment_declined: 402, cart_empty: 409, insufficient_stock: 409 } as const;

/** Places an order for the active cart. Replaying the same Idempotency-Key returns the original order. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const idempotencyKey = request.headers.get("idempotency-key") ?? "";
  if (!z.uuid().safeParse(idempotencyKey).success) {
    return apiError(400, "idempotency_key_required", "Send a UUID in the Idempotency-Key header.");
  }

  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = checkoutSchema.safeParse(json.body);
  if (!parsed.success) return validationError(parsed.error);

  const result = await placeOrder(auth.user.id, toPlaceOrderInput(parsed.data, idempotencyKey));
  if (!result.ok) {
    return Response.json(
      { code: result.code, message: result.error, ...(result.orderId && { orderId: result.orderId }) },
      { status: ERROR_STATUS[result.code] },
    );
  }
  return Response.json({ orderId: result.orderId, status: "paid" }, { status: 201 });
}
