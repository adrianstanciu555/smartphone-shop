import { isUuid, pool } from "./db";
import { toCents } from "./money";

export const CATEGORIES = ["smartphone", "case", "charger", "cable", "headphones", "screen_protector"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Availability = "in_stock" | "low_stock" | "out_of_stock";

export type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: Category;
  priceCents: number;
  rating: number;
  availability: Availability;
  available: number;
};

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: Category;
  price: string;
  rating: string;
  availability: Availability;
  available: number;
};

const SELECT_PRODUCT = `
  SELECT p.id, p.sku, p.name, b.name AS brand, p.category, p.price, p.rating,
         pa.availability, coalesce(s.quantity_available, 0) AS available
  FROM products p
  JOIN brands b ON b.id = p.brand_id
  JOIN product_availability pa ON pa.product_id = p.id
  LEFT JOIN stock_levels s ON s.product_id = p.id`;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    category: row.category,
    priceCents: toCents(row.price),
    rating: Number(row.rating),
    availability: row.availability,
    available: Number(row.available),
  };
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

export async function listProducts(filters: { q?: string; category?: Category }): Promise<Product[]> {
  const where = ["p.is_active"];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${filters.q.replace(/[\\%_]/g, "\\$&")}%`);
    where.push(`p.name ILIKE $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    where.push(`p.category = $${params.length}::product_category`);
  }

  const { rows } = await pool.query<ProductRow>(
    `${SELECT_PRODUCT} WHERE ${where.join(" AND ")} ORDER BY p.category, p.name`,
    params,
  );
  return rows.map(toProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!isUuid(id)) return null;
  const { rows } = await pool.query<ProductRow>(`${SELECT_PRODUCT} WHERE p.id = $1 AND p.is_active`, [id]);
  return rows[0] ? toProduct(rows[0]) : null;
}
