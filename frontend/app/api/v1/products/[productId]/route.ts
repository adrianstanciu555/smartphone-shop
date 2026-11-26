import { notFound, productJson } from "@/lib/api";
import { getProduct } from "@/lib/products";

export async function GET(_request: Request, ctx: RouteContext<"/api/v1/products/[productId]">) {
  const { productId } = await ctx.params;
  const product = await getProduct(productId);
  return product ? Response.json(productJson(product)) : notFound("Product not found.");
}
