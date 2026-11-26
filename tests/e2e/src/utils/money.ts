const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

/** Formats cents exactly like the app does, e.g. 109999 -> "€1,099.99". */
export function formatEur(cents: number): string {
  return eur.format(cents / 100);
}

export function toCents(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

/** VAT is included in the price: tax = line * rate / (100 + rate). */
export function includedTaxCents(lineTotalCents: number, taxRatePercent: number): number {
  return Math.round((lineTotalCents * taxRatePercent) / (100 + taxRatePercent));
}
