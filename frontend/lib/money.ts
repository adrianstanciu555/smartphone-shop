export const FREE_STANDARD_DELIVERY_FROM_CENTS = 5000;
export const STANDARD_DELIVERY_CENTS = 499;
export const EXPRESS_DELIVERY_CENTS = 999;

export type DeliveryMethod = "standard" | "express";

export function toCents(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

export function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatEur(cents: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function deliveryCostCents(method: DeliveryMethod, subtotalCents: number): number {
  if (method === "express") return EXPRESS_DELIVERY_CENTS;
  return subtotalCents >= FREE_STANDARD_DELIVERY_FROM_CENTS ? 0 : STANDARD_DELIVERY_CENTS;
}
