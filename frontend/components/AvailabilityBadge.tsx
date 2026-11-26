import type { Availability } from "@/lib/products";

const LABELS: Record<Availability, { text: string; className: string }> = {
  in_stock: { text: "In stock", className: "bg-green-100 text-green-800" },
  low_stock: { text: "Low stock", className: "bg-amber-100 text-amber-800" },
  out_of_stock: { text: "Out of stock", className: "bg-slate-200 text-slate-700" },
};

export function AvailabilityBadge({ availability }: { availability: Availability }) {
  const { text, className } = LABELS[availability];
  return (
    <span className={`rounded px-2 py-0.5 text-xs ${className}`} data-testid="product-availability">
      {text}
    </span>
  );
}
