import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEur } from "@/lib/money";
import { getOrder } from "@/lib/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Order | Smartphone Shop" };

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/orders/${id}`);
  // Other users' orders return 404, same as the API contract.
  const order = await getOrder(user.id, id);
  if (!order) notFound();

  const paid = order.status === "paid";

  return (
    <section className="mx-auto max-w-2xl space-y-6" data-testid="order-confirmation" data-order-id={order.id}>
      <div className={`rounded p-4 ${paid ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
        <h1 className="text-2xl font-bold" data-testid="order-heading">
          {paid ? "Thank you for your order!" : "Order not completed"}
        </h1>
        <p>
          Order number <strong data-testid="order-number">{order.number}</strong>, status{" "}
          <strong data-testid="order-status">{order.status}</strong>
        </p>
      </div>

      <div className="rounded border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">Items</h2>
        <ul className="divide-y divide-slate-200 text-sm" data-testid="order-items">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between py-2" data-testid="order-item">
              <span>
                <span data-testid="order-item-name">{item.name}</span> x <span data-testid="order-item-quantity">{item.quantity}</span>
              </span>
              <span data-testid="order-item-total">{formatEur(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd data-testid="order-subtotal">{formatEur(order.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt>Delivery ({order.deliveryMethod})</dt><dd data-testid="order-delivery">{formatEur(order.shippingCents)}</dd></div>
          <div className="flex justify-between text-slate-500"><dt>Included VAT</dt><dd data-testid="order-tax">{formatEur(order.taxCents)}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd data-testid="order-total">{formatEur(order.totalCents)}</dd></div>
        </dl>
      </div>

      <div className="rounded border border-slate-200 bg-white p-4 text-sm" data-testid="order-address">
        <h2 className="mb-2 font-semibold">Delivery address</h2>
        <p>{order.address.recipient}</p>
        <p>{order.address.line1}</p>
        {order.address.line2 && <p>{order.address.line2}</p>}
        <p>{order.address.postalCode} {order.address.city}, {order.address.country}</p>
        <p>{order.address.phone}</p>
      </div>

      <Link href="/catalog" className="inline-block text-indigo-700 hover:underline" data-testid="continue-shopping">
        Continue shopping
      </Link>
    </section>
  );
}
