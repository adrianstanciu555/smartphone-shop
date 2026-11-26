import { randomUUID } from "node:crypto";
import { isUuid, pool, withTransaction } from "./db";
import { centsToAmount, deliveryCostCents, toCents, type DeliveryMethod } from "./money";

export const TEST_CARDS = {
  success: "4242424242424242",
  declined: "4000000000000002",
} as const;

export type ShippingAddress = {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
};

export type PlaceOrderInput = {
  idempotencyKey: string;
  address: ShippingAddress;
  deliveryMethod: DeliveryMethod;
  cardNumber: string;
};

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; code: "payment_declined" | "cart_empty" | "insufficient_stock"; error: string; orderId?: string };

type LockedItem = {
  product_id: string;
  name: string;
  sku: string;
  price: string;
  tax_rate: string;
  quantity: number;
  available: number;
};

/**
 * Creates the order and charges the dummy card in one transaction.
 * Stock rows are locked so two customers cannot both buy the last unit.
 */
export async function placeOrder(userId: string, input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const previous = await pool.query<{ id: string; status: string }>(
    "SELECT id, status FROM orders WHERE user_id = $1 AND idempotency_key = $2",
    [userId, input.idempotencyKey],
  );
  if (previous.rows[0]) {
    const { id, status } = previous.rows[0];
    return status === "paid"
      ? { ok: true, orderId: id }
      : { ok: false, code: "payment_declined", error: "Payment declined.", orderId: id };
  }

  const paymentSucceeds = input.cardNumber === TEST_CARDS.success;

  return withTransaction(async (client) => {
    const cart = await client.query<{ id: string }>(
      "SELECT id FROM carts WHERE user_id = $1 AND status = 'active' FOR UPDATE",
      [userId],
    );
    const cartId = cart.rows[0]?.id;
    if (!cartId) return { ok: false, code: "cart_empty", error: "Your cart is empty." };

    const { rows: items } = await client.query<LockedItem>(
      `SELECT ci.product_id, p.name, p.sku, p.price, p.tax_rate, ci.quantity,
              s.quantity_on_hand - s.quantity_reserved AS available
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN stock_levels s ON s.product_id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY ci.product_id
       FOR UPDATE OF s`,
      [cartId],
    );
    if (items.length === 0) return { ok: false, code: "cart_empty", error: "Your cart is empty." };

    const shortage = items.find((item) => item.quantity > Number(item.available));
    if (shortage) {
      return { ok: false, code: "insufficient_stock", error: `Not enough stock for ${shortage.name}. Please update your cart.` };
    }

    const lines = items.map((item) => {
      const lineTotalCents = toCents(item.price) * item.quantity;
      const taxRate = Number(item.tax_rate);
      return { ...item, lineTotalCents, taxCents: Math.round((lineTotalCents * taxRate) / (100 + taxRate)) };
    });
    const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    const taxCents = lines.reduce((sum, line) => sum + line.taxCents, 0);
    const shippingCents = deliveryCostCents(input.deliveryMethod, subtotalCents);
    const totalCents = subtotalCents + shippingCents;

    const order = await client.query<{ id: string }>(
      `INSERT INTO orders (user_id, idempotency_key, status, delivery_method, shipping_address,
                           subtotal, tax_total, shipping_total, total)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        input.idempotencyKey,
        input.deliveryMethod,
        JSON.stringify(input.address),
        centsToAmount(subtotalCents),
        centsToAmount(taxCents),
        centsToAmount(shippingCents),
        centsToAmount(totalCents),
      ],
    );
    const orderId = order.rows[0].id;

    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, sku, unit_price, tax_rate, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, line.product_id, line.name, line.sku, line.price, line.tax_rate, line.quantity, centsToAmount(line.lineTotalCents)],
      );
    }
    await client.query(
      "INSERT INTO order_status_history (order_id, from_status, to_status) VALUES ($1, NULL, 'pending')",
      [orderId],
    );

    await client.query(
      `INSERT INTO payments (order_id, provider, provider_payment_intent, status, amount, failure_code)
       VALUES ($1, 'dummy', $2, $3, $4, $5)`,
      [
        orderId,
        `dummy_pi_${randomUUID()}`,
        paymentSucceeds ? "succeeded" : "failed",
        centsToAmount(totalCents),
        paymentSucceeds ? null : "card_declined",
      ],
    );

    if (!paymentSucceeds) {
      await client.query("UPDATE orders SET status = 'payment_failed' WHERE id = $1", [orderId]);
      await client.query(
        "INSERT INTO order_status_history (order_id, from_status, to_status, note) VALUES ($1, 'pending', 'payment_failed', 'card_declined')",
        [orderId],
      );
      return { ok: false, code: "payment_declined", error: "Payment declined. Your card was not charged.", orderId };
    }

    for (const line of lines) {
      await client.query(
        "UPDATE stock_levels SET quantity_on_hand = quantity_on_hand - $2 WHERE product_id = $1",
        [line.product_id, line.quantity],
      );
      await client.query(
        "INSERT INTO stock_movements (product_id, type, quantity, reference) VALUES ($1, 'deduct', $2, $3)",
        [line.product_id, -line.quantity, orderId],
      );
    }
    // cart_id is only linked on success so a declined attempt does not block retrying the same cart.
    await client.query("UPDATE orders SET status = 'paid', paid_at = now(), cart_id = $2 WHERE id = $1", [orderId, cartId]);
    await client.query(
      "INSERT INTO order_status_history (order_id, from_status, to_status) VALUES ($1, 'pending', 'paid')",
      [orderId],
    );
    await client.query("UPDATE carts SET status = 'converted' WHERE id = $1", [cartId]);

    return { ok: true, orderId };
  });
}

export type OrderDetails = {
  id: string;
  number: string;
  status: string;
  deliveryMethod: DeliveryMethod;
  address: ShippingAddress;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: Date;
  items: { productId: string; name: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
};

/** Returns the order only if it belongs to the given user. */
export async function getOrder(userId: string, orderId: string): Promise<OrderDetails | null> {
  if (!isUuid(orderId)) return null;

  const { rows } = await pool.query(
    `SELECT id, order_number, status, delivery_method, shipping_address,
            subtotal, tax_total, shipping_total, total, created_at
     FROM orders WHERE id = $1 AND user_id = $2`,
    [orderId, userId],
  );
  const order = rows[0];
  if (!order) return null;

  const items = await pool.query(
    "SELECT product_id, product_name, quantity, unit_price, line_total FROM order_items WHERE order_id = $1 ORDER BY product_name",
    [orderId],
  );

  return {
    id: order.id,
    number: String(order.order_number),
    status: order.status,
    deliveryMethod: order.delivery_method,
    address: order.shipping_address,
    subtotalCents: toCents(order.subtotal),
    taxCents: toCents(order.tax_total),
    shippingCents: toCents(order.shipping_total),
    totalCents: toCents(order.total),
    createdAt: order.created_at,
    items: items.rows.map((row) => ({
      productId: row.product_id,
      name: row.product_name,
      quantity: row.quantity,
      unitPriceCents: toCents(row.unit_price),
      lineTotalCents: toCents(row.line_total),
    })),
  };
}
