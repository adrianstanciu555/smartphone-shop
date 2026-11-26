"use client";

import { useActionState } from "react";
import { addToCartAction, type CartActionState } from "@/app/actions/cart";
import { SubmitButton } from "./SubmitButton";

export function AddToCartForm({ productId, maxQuantity }: { productId: string; maxQuantity: number }) {
  const [state, formAction] = useActionState<CartActionState, FormData>(addToCartAction, {});
  const outOfStock = maxQuantity <= 0;

  return (
    <form action={formAction} className="space-y-3" data-testid="add-to-cart-form">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex items-end gap-3">
        <div>
          <label htmlFor="quantity" className="mb-1 block text-sm font-medium">Quantity</label>
          <select
            id="quantity"
            name="quantity"
            defaultValue="1"
            disabled={outOfStock}
            className="rounded border border-slate-300 px-3 py-2"
            data-testid="quantity-select"
          >
            {Array.from({ length: Math.max(1, maxQuantity) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <SubmitButton pendingText="Adding..." testId="add-to-cart-button" disabled={outOfStock}>
          {outOfStock ? "Out of stock" : "Add to cart"}
        </SubmitButton>
      </div>
      <div aria-live="polite">
        {state.error && <p role="alert" className="text-sm text-red-600" data-testid="add-to-cart-error">{state.error}</p>}
        {state.success && <p className="text-sm text-green-700" data-testid="add-to-cart-success">{state.success}</p>}
      </div>
    </form>
  );
}
