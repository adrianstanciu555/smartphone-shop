import { CATEGORIES } from "@/lib/products";

export function GET() {
  return Response.json(CATEGORIES);
}
