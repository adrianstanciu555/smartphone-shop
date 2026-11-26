import { z } from "zod";
import { productJson, validationError } from "@/lib/api";
import { CATEGORIES, listProducts } from "@/lib/products";

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);

  const { q, category, page, pageSize } = parsed.data;
  // At most a few hundred products, so paging in memory keeps listProducts shared with the catalog page.
  const products = await listProducts({ q: q || undefined, category });
  const items = products.slice((page - 1) * pageSize, page * pageSize).map(productJson);

  return Response.json({ items, page, pageSize, total: products.length });
}
