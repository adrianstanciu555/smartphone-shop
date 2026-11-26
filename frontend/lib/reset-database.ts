import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const BRANDS = [
  "Samsung", "Apple", "Google", "Motorola", "Xiaomi", "OPPO", "HONOR", "Sony", "Vivo", "OnePlus",
  "Anker", "Belkin", "Spigen", "Techsuit", "UGREEN", "HOCO", "McDodo", "Baseus", "Ringke",
  "Nillkin", "PanzerGlass", "Urban Armor Gear", "JBL", "Philips",
];

const STOCK_PER_AVAILABLE_PRODUCT = 50;

// Paths are relative to frontend/, where both `npm run db:reset` and `next dev` run.
const repoRoot = path.resolve(process.cwd(), "..");

/** Drops and recreates the schema, then seeds brands, products and stock (mirrors database/seeds/products.sql). */
export async function resetDatabase(connectionString: string): Promise<{ products: number }> {
  const schemaSql = await readFile(path.join(repoRoot, "database", "migrations", "schema.sql"), "utf8");
  const csv = await readFile(path.join(repoRoot, "docs", "products-seed.csv"), "utf8");

  const rows = csv
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [name, category, price, rating, availability] = line.split(",");
      return { name, category, price, rating, inStock: availability.trim() === "true" };
    });

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
    await client.query(schemaSql);

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO brands (name, slug)
       SELECT b, lower(replace(b, ' ', '-')) FROM unnest($1::text[]) AS b`,
      [BRANDS],
    );
    for (const row of rows) {
      await client.query(
        `WITH ins AS (
           INSERT INTO products (sku, name, brand_id, category, price, tax_rate, rating)
           SELECT upper(regexp_replace($1, '[^A-Za-z0-9]+', '-', 'g')), $1,
                  (SELECT id FROM brands WHERE $1 LIKE name || ' %' ORDER BY length(name) DESC LIMIT 1),
                  $2::product_category, $3, 5.00, $4
           RETURNING id
         )
         INSERT INTO stock_levels (product_id, quantity_on_hand) SELECT id, $5 FROM ins`,
        [row.name, row.category, row.price, row.rating, row.inStock ? STOCK_PER_AVAILABLE_PRODUCT : 0],
      );
    }
    await client.query("COMMIT");
    return { products: rows.length };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}
