import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getCart } from "@/lib/cart";
import { formatEur } from "@/lib/money";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Checkout | Smartphone Shop" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const cart = await getCart(user.id);
  if (cart.items.length === 0) redirect("/cart");

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <ul className="mb-6 rounded border border-slate-200 bg-white p-4 text-sm" data-testid="checkout-items">
        {cart.items.map((item) => (
          <li key={item.productId} className="flex justify-between py-1" data-testid="checkout-item">
            <span>
              <span data-testid="checkout-item-name">{item.name}</span> x <span data-testid="checkout-item-quantity">{item.quantity}</span>
            </span>
            <span data-testid="checkout-item-total">{formatEur(item.lineTotalCents)}</span>
          </li>
        ))}
      </ul>
      <CheckoutForm subtotalCents={cart.subtotalCents} initialIdempotencyKey={randomUUID()} />
    </section>
  );
}
