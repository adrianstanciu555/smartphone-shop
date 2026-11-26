"use client";

import { useActionState, useState } from "react";
import { placeOrderAction, type CheckoutField, type CheckoutState } from "@/app/actions/checkout";
import { deliveryCostCents, formatEur, type DeliveryMethod } from "@/lib/money";
import { SubmitButton } from "./SubmitButton";

const inputClass = "w-full rounded border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none";

type FieldProps = {
  name: CheckoutField;
  label: string;
  state: CheckoutState;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: "numeric" | "tel" | "text";
  keepValue?: boolean;
};

function Field({ name, label, state, autoComplete, placeholder, inputMode, keepValue = true }: FieldProps) {
  const error = state.fieldErrors?.[name];
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <input
        id={name}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        defaultValue={keepValue ? state.values?.[name] : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={inputClass}
        data-testid={`checkout-${name}`}
      />
      {error && <p id={`${name}-error`} className="mt-1 text-sm text-red-600" data-testid={`checkout-${name}-error`}>{error}</p>}
    </div>
  );
}

export function CheckoutForm({ subtotalCents, initialIdempotencyKey }: { subtotalCents: number; initialIdempotencyKey: string }) {
  const [state, formAction] = useActionState<CheckoutState, FormData>(placeOrderAction, {
    idempotencyKey: initialIdempotencyKey,
  });
  const submittedMethod: DeliveryMethod = state.values?.deliveryMethod === "express" ? "express" : "standard";
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(submittedMethod);
  const shippingCents = deliveryCostCents(deliveryMethod, subtotalCents);

  return (
    <form action={formAction} noValidate className="grid gap-8 md:grid-cols-[1fr_320px]" data-testid="checkout-form">
      <input type="hidden" name="idempotencyKey" value={state.idempotencyKey ?? initialIdempotencyKey} />
      <div className="space-y-8">
        {state.error && (
          <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700" data-testid="checkout-error">{state.error}</p>
        )}

        <fieldset className="space-y-4 rounded border border-slate-200 bg-white p-4">
          <legend className="px-1 font-semibold">Delivery address</legend>
          <Field name="recipient" label="Full name" state={state} autoComplete="name" />
          <Field name="phone" label="Phone" state={state} autoComplete="tel" inputMode="tel" placeholder="+40 721 345 678" />
          <Field name="line1" label="Address line 1" state={state} autoComplete="address-line1" />
          <Field name="line2" label="Address line 2 (optional)" state={state} autoComplete="address-line2" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="city" label="City" state={state} autoComplete="address-level2" />
            <Field name="postalCode" label="Postal code" state={state} autoComplete="postal-code" />
            <Field name="country" label="Country code" state={state} autoComplete="country" placeholder="RO" />
          </div>
        </fieldset>

        <fieldset className="space-y-2 rounded border border-slate-200 bg-white p-4" data-testid="delivery-methods">
          <legend className="px-1 font-semibold">Delivery method</legend>
          {(["standard", "express"] as const).map((method) => (
            <label key={method} className="flex items-center gap-2">
              {/* Uncontrolled on purpose: React resets the form after each action, which would otherwise
                  uncheck a controlled radio while the summary still shows the chosen method. */}
              <input
                type="radio"
                name="deliveryMethod"
                value={method}
                defaultChecked={submittedMethod === method}
                onChange={() => setDeliveryMethod(method)}
                data-testid={`delivery-${method}`}
              />
              {method === "standard"
                ? "Standard: €4.99, free from €50.00"
                : "Express: €9.99"}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-4 rounded border border-slate-200 bg-white p-4">
          <legend className="px-1 font-semibold">Payment (test mode)</legend>
          <p className="text-sm text-slate-500" data-testid="test-cards-hint">
            Use 4242 4242 4242 4242 for a successful payment or 4000 0000 0000 0002 for a declined payment.
          </p>
          <Field name="cardName" label="Name on card" state={state} autoComplete="cc-name" />
          <Field name="cardNumber" label="Card number" state={state} autoComplete="cc-number" inputMode="numeric" placeholder="4242 4242 4242 4242" keepValue={false} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="expiry" label="Expiry (MM/YY)" state={state} autoComplete="cc-exp" placeholder="12/30" />
            <Field name="cvc" label="CVC" state={state} autoComplete="cc-csc" inputMode="numeric" placeholder="123" keepValue={false} />
          </div>
        </fieldset>
      </div>

      <aside className="h-fit space-y-3 rounded border border-slate-200 bg-white p-4" data-testid="order-summary">
        <h2 className="font-semibold">Order summary</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd data-testid="summary-subtotal">{formatEur(subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd data-testid="summary-delivery">{formatEur(shippingCents)}</dd></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
            <dt>Total</dt><dd data-testid="summary-total">{formatEur(subtotalCents + shippingCents)}</dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500">Prices include VAT.</p>
        <SubmitButton pendingText="Processing payment..." testId="place-order-button" className="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:bg-slate-400">
          Pay {formatEur(subtotalCents + shippingCents)}
        </SubmitButton>
      </aside>
    </form>
  );
}
