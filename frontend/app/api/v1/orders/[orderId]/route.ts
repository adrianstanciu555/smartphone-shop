import { notFound, orderJson, requireApiUser } from "@/lib/api";
import { getOrder } from "@/lib/orders";

/** Other customers' orders return 404, not 403, so order ids cannot be probed. */
export async function GET(_request: Request, ctx: RouteContext<"/api/v1/orders/[orderId]">) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { orderId } = await ctx.params;
  const order = await getOrder(auth.user.id, orderId);
  return order ? Response.json(orderJson(order)) : notFound("Order not found.");
}
