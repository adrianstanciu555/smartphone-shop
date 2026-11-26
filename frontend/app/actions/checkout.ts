"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkoutSchema as checkoutFieldsSchema, toPlaceOrderInput } from "@/lib/checkout-schema";
import { placeOrder } from "@/lib/orders";
import { getSessionUser } from "@/lib/session";

export type CheckoutField =
  | "recipient" | "phone" | "line1" | "line2" | "city" | "postalCode" | "country"
  | "deliveryMethod" | "cardName" | "cardNumber" | "expiry" | "cvc";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<CheckoutField, string>>;
  values?: Partial<Record<CheckoutField, string>>;
  idempotencyKey?: string;
};

const checkoutSchema = checkoutFieldsSchema.extend({ idempotencyKey: z.uuid() });

export async function placeOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/checkout");

  const raw = Object.fromEntries(
    Object.keys(checkoutSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]),
  ) as Record<keyof typeof checkoutSchema.shape, string>;
  const idempotencyKey = raw.idempotencyKey;
  // Never echo card data back to the browser.
  const safeValues = Object.fromEntries(
    Object.entries(raw).filter(([key]) => !["cardNumber", "cvc", "idempotencyKey"].includes(key)),
  );

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    return {
      values: safeValues,
      idempotencyKey: z.uuid().safeParse(idempotencyKey).success ? idempotencyKey : randomUUID(),
      fieldErrors: Object.fromEntries(
        Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]]),
      ),
    };
  }

  const data = parsed.data;
  // Simulated payment provider latency, useful for practising Playwright waits.
  await new Promise((resolve) => setTimeout(resolve, 800));
  const result = await placeOrder(user.id, toPlaceOrderInput(data, data.idempotencyKey));

  revalidatePath("/", "layout");
  if (!result.ok) {
    // A new key lets the customer retry after a declined payment without hitting the old order.
    return { error: result.error, values: safeValues, idempotencyKey: randomUUID() };
  }
  redirect(`/orders/${result.orderId}`);
}
