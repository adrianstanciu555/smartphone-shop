import { z } from "zod";
import { apiError, cartResponse, readJson, requireApiUser, validationError } from "@/lib/api";
import { MAX_QUANTITY_PER_ITEM, removeCartItem, updateCartItem } from "@/lib/cart";

const updateSchema = z.object({ quantity: z.int().min(1).max(MAX_QUANTITY_PER_ITEM) });

export async function PATCH(request: Request, ctx: RouteContext<"/api/v1/cart/items/[productId]">) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;

  const parsed = updateSchema.safeParse(json.body);
  if (!parsed.success) return validationError(parsed.error);

  const { productId } = await ctx.params;
  return cartResponse(auth.user.id, await updateCartItem(auth.user.id, productId, parsed.data.quantity));
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/v1/cart/items/[productId]">) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { productId } = await ctx.params;
  if (!(await removeCartItem(auth.user.id, productId))) {
    return apiError(404, "not_in_cart", "This product is not in your cart.");
  }
  return cartResponse(auth.user.id, { ok: true });
}
