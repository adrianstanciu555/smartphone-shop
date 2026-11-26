import { Pool } from "pg";
import { toCents } from "../utils/money";

export type DbProduct = { id: string; name: string; priceCents: number; taxRate: number; stockOnHand: number };

export type DbOrder = {
  id: string;
  number: string;
  status: string;
  deliveryMethod: string;
  totalCents: number;
  paymentStatus: string | null;
  failureCode: string | null;
};

/** Direct database access for test setup lookups and back-end assertions. Never writes. */
export class DbHelper {
  private readonly pool: Pool;

  constructor(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Create frontend/.env.local or export DATABASE_URL.");
    }
    this.pool = new Pool({ connectionString, max: 2 });
  }

  async getProductByName(name: string): Promise<DbProduct> {
    const { rows } = await this.pool.query(
      `SELECT p.id, p.name, p.price, p.tax_rate, coalesce(s.quantity_on_hand, 0) AS on_hand
       FROM products p LEFT JOIN stock_levels s ON s.product_id = p.id
       WHERE p.name = $1`,
      [name],
    );
    if (!rows[0]) throw new Error(`Seed product not found: ${name}`);
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      priceCents: toCents(row.price),
      taxRate: Number(row.tax_rate),
      stockOnHand: Number(row.on_hand),
    };
  }

  async getStockOnHand(productId: string): Promise<number> {
    const { rows } = await this.pool.query("SELECT quantity_on_hand FROM stock_levels WHERE product_id = $1", [productId]);
    return Number(rows[0]?.quantity_on_hand ?? 0);
  }

  async getOrdersForUser(email: string): Promise<DbOrder[]> {
    const { rows } = await this.pool.query(
      `SELECT o.id, o.order_number, o.status, o.delivery_method, o.total,
              pa.status AS payment_status, pa.failure_code
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN payments pa ON pa.order_id = o.id
       WHERE u.email = $1
       ORDER BY o.created_at`,
      [email.toLowerCase()],
    );
    return rows.map((row) => ({
      id: row.id,
      number: String(row.order_number),
      status: row.status,
      deliveryMethod: row.delivery_method,
      totalCents: toCents(row.total),
      paymentStatus: row.payment_status,
      failureCode: row.failure_code,
    }));
  }

  /** Product name -> quantity in the user's active cart. */
  async getActiveCartQuantities(email: string): Promise<Record<string, number>> {
    const { rows } = await this.pool.query(
      `SELECT p.name, ci.quantity
       FROM carts c
       JOIN users u ON u.id = c.user_id
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN products p ON p.id = ci.product_id
       WHERE u.email = $1 AND c.status = 'active'`,
      [email.toLowerCase()],
    );
    return Object.fromEntries(rows.map((row) => [row.name, Number(row.quantity)]));
  }

  async userExists(email: string): Promise<boolean> {
    const { rowCount } = await this.pool.query("SELECT 1 FROM users WHERE email = $1", [email.toLowerCase()]);
    return (rowCount ?? 0) > 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
