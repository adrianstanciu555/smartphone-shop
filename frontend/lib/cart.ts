import type { PoolClient } from "pg";
import { isUuid, pool, withTransaction } from "./db";
import { toCents } from "./money";

export const MAX_QUANTITY_PER_ITEM = 10;

export type CartItem = {
  productId: string;
  name: string;
  brand: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  availableStock: number;
  isAvailable: boolean;
};

export type Cart = { items: CartItem[]; itemCount: number; subtotalCents: number };

export type CartErrorCode = "not_found" | "not_in_cart" | "out_of_stock" | "insufficient_stock" | "quantity_limit";

export type CartResult = { ok: true } | { ok: false; code: CartErrorCode; error: string };

async function getOrCreateActiveCartId(client: PoolClient, userId: string): Promise<string> {
  await client.query(
    `INSERT INTO carts (user_id) VALUES ($1)
     ON CONFLICT (user_id) WHERE status = 'active' DO NOTHING`,
    [userId],
  );
  const { rows } = await client.query<{ id: string }>(
    "SELECT id FROM carts WHERE user_id = $1 AND status = 'active' FOR UPDATE",
    [userId],
  );
  return rows[0].id;
}

// Prices are always read from products, never stored in the cart.
export async function getCart(userId: string): Promise<Cart> {
  const { rows } = await pool.query<{
    product_id: string;
    name: string;
    brand: string;
    quantity: number;
    price: string;
    available: number;
  }>(
    `SELECT ci.product_id, p.name, b.name AS brand, ci.quantity, p.price,
            coalesce(s.quantity_available, 0) AS available
     FROM carts c
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON p.id = ci.product_id
     JOIN brands b ON b.id = p.brand_id
     LEFT JOIN stock_levels s ON s.product_id = p.id
     WHERE c.user_id = $1 AND c.status = 'active'
     ORDER BY ci.added_at, p.name`,
    [userId],
  );

  const items = rows.map((row) => {
    const unitPriceCents = toCents(row.price);
    return {
      productId: row.product_id,
      name: row.name,
      brand: row.brand,
      quantity: row.quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * row.quantity,
      availableStock: Number(row.available),
      isAvailable: row.quantity <= Number(row.available),
    };
  });

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
  };
}

export async function getCartItemCount(userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT coalesce(sum(ci.quantity), 0) AS count
     FROM carts c JOIN cart_items ci ON ci.cart_id = c.id
     WHERE c.user_id = $1 AND c.status = 'active'`,
    [userId],
  );
  return Number(rows[0].count);
}

async function availableStock(client: PoolClient, productId: string): Promise<number | null> {
  const { rows } = await client.query<{ available: number }>(
    `SELECT coalesce(s.quantity_available, 0) AS available
     FROM products p LEFT JOIN stock_levels s ON s.product_id = p.id
     WHERE p.id = $1 AND p.is_active`,
    [productId],
  );
  return rows[0] ? Number(rows[0].available) : null;
}

export async function addToCart(userId: string, productId: string, quantity: number): Promise<CartResult> {
  if (!isUuid(productId)) return { ok: false, code: "not_found", error: "Product not found." };

  return withTransaction(async (client) => {
    const available = await availableStock(client, productId);
    if (available === null) return { ok: false, code: "not_found", error: "Product not found." };
    if (available <= 0) return { ok: false, code: "out_of_stock", error: "This product is out of stock." };

    const cartId = await getOrCreateActiveCartId(client, userId);
    const { rows } = await client.query<{ quantity: number }>(
      "SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2",
      [cartId, productId],
    );
    const newQuantity = (rows[0]?.quantity ?? 0) + quantity;

    if (newQuantity > MAX_QUANTITY_PER_ITEM) {
      return { ok: false, code: "quantity_limit", error: `You can buy at most ${MAX_QUANTITY_PER_ITEM} units of this product.` };
    }
    if (newQuantity > available) {
      return { ok: false, code: "insufficient_stock", error: `Only ${available} unit(s) available.` };
    }

    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [cartId, productId, newQuantity],
    );
    return { ok: true };
  });
}

export async function updateCartItem(userId: string, productId: string, quantity: number): Promise<CartResult> {
  if (!isUuid(productId)) return { ok: false, code: "not_found", error: "Product not found." };

  return withTransaction(async (client) => {
    const inCart = await client.query(
      `SELECT 1 FROM cart_items ci JOIN carts c ON c.id = ci.cart_id
       WHERE c.user_id = $1 AND c.status = 'active' AND ci.product_id = $2
       FOR UPDATE OF ci`,
      [userId, productId],
    );
    if (!inCart.rowCount) return { ok: false, code: "not_in_cart", error: "This product is not in your cart." };

    const available = await availableStock(client, productId);
    if (available === null) return { ok: false, code: "not_found", error: "Product not found." };
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      return { ok: false, code: "quantity_limit", error: `You can buy at most ${MAX_QUANTITY_PER_ITEM} units of this product.` };
    }
    if (quantity > available) return { ok: false, code: "insufficient_stock", error: `Only ${available} unit(s) available.` };

    await client.query(
      `UPDATE cart_items ci SET quantity = $3 FROM carts c
       WHERE ci.cart_id = c.id AND c.user_id = $1 AND c.status = 'active' AND ci.product_id = $2`,
      [userId, productId, quantity],
    );
    return { ok: true };
  });
}

/** Returns false when the product was not in the cart. */
export async function removeCartItem(userId: string, productId: string): Promise<boolean> {
  if (!isUuid(productId)) return false;
  const { rowCount } = await pool.query(
    `DELETE FROM cart_items ci USING carts c
     WHERE ci.cart_id = c.id AND c.user_id = $1 AND c.status = 'active' AND ci.product_id = $2`,
    [userId, productId],
  );
  return (rowCount ?? 0) > 0;
}

export async function clearCart(userId: string): Promise<void> {
  await pool.query(
    `DELETE FROM cart_items ci USING carts c
     WHERE ci.cart_id = c.id AND c.user_id = $1 AND c.status = 'active'`,
    [userId],
  );
}
