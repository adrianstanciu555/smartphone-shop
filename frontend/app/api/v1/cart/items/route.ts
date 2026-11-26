import { z } from "zod";
import { cartResponse, readJson, requireApiUser, validationError } from "@/lib/api";
import { addToCart, MAX_QUANTITY_PER_ITEM } from "@/lib/cart";

const cartItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.int().min(1).max(MAX_QUANTITY_PER_ITEM),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;

  const parsed = cartItemSchema.safeParse(json.body);
  if (!parsed.success) return validationError(parsed.error);

  const result = await addToCart(auth.user.id, parsed.data.productId, parsed.data.quantity);
  return cartResponse(auth.user.id, result);
}
