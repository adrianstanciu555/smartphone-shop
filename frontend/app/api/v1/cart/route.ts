import { cartJson, requireApiUser } from "@/lib/api";
import { clearCart, getCart } from "@/lib/cart";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  return Response.json(cartJson(await getCart(auth.user.id)));
}

export async function DELETE() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  await clearCart(auth.user.id);
  return new Response(null, { status: 204 });
}
