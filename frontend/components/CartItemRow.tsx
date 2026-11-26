"use client";

import { useActionState } from "react";
import { removeCartItemAction, updateCartItemAction, type CartActionState } from "@/app/actions/cart";
import type { CartItem } from "@/lib/cart";
import { formatEur } from "@/lib/money";
import { SubmitButton } from "./SubmitButton";

export function CartItemRow({ item, maxQuantity }: { item: CartItem; maxQuantity: number }) {
  const [state, formAction] = useActionState<CartActionState, FormData>(updateCartItemAction, {});

  return (
    <li className="flex flex-wrap items-center gap-4 py-4" data-testid="cart-item" data-product-id={item.productId}>
      <div className="min-w-48 flex-1">
        <p className="font-medium" data-testid="cart-item-name">{item.name}</p>
        <p className="text-sm text-slate-500">
          <span data-testid="cart-item-unit-price">{formatEur(item.unitPriceCents)}</span> each
        </p>
        {!item.isAvailable && (
          <p role="alert" className="text-sm text-red-600" data-testid="cart-item-stock-warning">
            Only {item.availableStock} unit(s) available.
          </p>
        )}
        {state.error && <p role="alert" className="text-sm text-red-600" data-testid="cart-item-error">{state.error}</p>}
      </div>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="productId" value={item.productId} />
        <label htmlFor={`qty-${item.productId}`} className="text-sm">Qty</label>
        <input
          id={`qty-${item.productId}`}
          name="quantity"
          type="number"
          min={1}
          max={maxQuantity}
          defaultValue={item.quantity}
          className="w-16 rounded border border-slate-300 px-2 py-1"
          data-testid="cart-item-quantity"
        />
        <SubmitButton pendingText="..." testId="cart-item-update" className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-50">
          Update
        </SubmitButton>
      </form>
      <p className="w-24 text-right font-medium" data-testid="cart-item-line-total">{formatEur(item.lineTotalCents)}</p>
      <form action={removeCartItemAction}>
        <input type="hidden" name="productId" value={item.productId} />
        <SubmitButton pendingText="Removing..." testId="cart-item-remove" className="text-sm text-red-600 hover:underline disabled:opacity-50">
          Remove
        </SubmitButton>
      </form>
    </li>
  );
}
