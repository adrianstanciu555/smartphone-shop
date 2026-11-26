import type { Metadata } from "next";
import Link from "next/link";
import { CartItemRow } from "@/components/CartItemRow";
import { getCart, MAX_QUANTITY_PER_ITEM } from "@/lib/cart";
import { formatEur } from "@/lib/money";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Cart | Smartphone Shop" };

export default async function CartPage() {
  const user = await requireUser("/cart");
  const cart = await getCart(user.id);
  const canCheckout = cart.items.length > 0 && cart.items.every((item) => item.isAvailable);

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Your cart</h1>
      {cart.items.length === 0 ? (
        <div data-testid="cart-empty">
          <p className="mb-4">Your cart is empty.</p>
          <Link href="/catalog" className="text-indigo-700 hover:underline" data-testid="continue-shopping">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="rounded border border-slate-200 bg-white p-4">
          <ul className="divide-y divide-slate-200" data-testid="cart-items">
            {cart.items.map((item) => (
              <CartItemRow key={item.productId} item={item} maxQuantity={MAX_QUANTITY_PER_ITEM} />
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-6 border-t border-slate-200 pt-4">
            <p className="text-lg">
              Subtotal: <strong data-testid="cart-subtotal">{formatEur(cart.subtotalCents)}</strong>
            </p>
            {canCheckout ? (
              <Link href="/checkout" className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700" data-testid="checkout-button">
                Proceed to checkout
              </Link>
            ) : (
              <span aria-disabled className="cursor-not-allowed rounded bg-slate-400 px-4 py-2 font-medium text-white" data-testid="checkout-button">
                Proceed to checkout
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
