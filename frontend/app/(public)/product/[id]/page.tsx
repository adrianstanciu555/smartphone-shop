import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AddToCartForm } from "@/components/AddToCartForm";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart";
import { formatEur } from "@/lib/money";
import { getProduct } from "@/lib/products";

// Shared by generateMetadata and the page so the product is queried once per request.
const loadProduct = cache(getProduct);

export async function generateMetadata({ params }: PageProps<"/product/[id]">): Promise<Metadata> {
  const product = await loadProduct((await params).id);
  return { title: `${product ? product.name : "Product not found"} | Smartphone Shop` };
}

export default async function ProductPage({ params }: PageProps<"/product/[id]">) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  return (
    <article className="grid gap-8 md:grid-cols-2" data-testid="product-details" data-product-id={product.id}>
      <div aria-hidden className="flex h-80 items-center justify-center rounded bg-slate-100 text-6xl font-bold text-slate-400">
        {product.brand.slice(0, 2).toUpperCase()}
      </div>
      <div className="space-y-4">
        <Link href="/catalog" className="text-sm text-indigo-700 hover:underline" data-testid="back-to-catalog">
          &larr; Back to catalog
        </Link>
        <p className="text-sm uppercase text-slate-500" data-testid="product-brand">{product.brand}</p>
        <h1 className="text-3xl font-bold" data-testid="product-title">{product.name}</h1>
        <p className="text-sm text-slate-500">
          SKU: <span data-testid="product-sku">{product.sku}</span> | Rating:{" "}
          <span data-testid="product-rating">{product.rating.toFixed(1)}</span> / 5
        </p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold" data-testid="product-price">{formatEur(product.priceCents)}</span>
          <AvailabilityBadge availability={product.availability} />
        </div>
        <p className="text-xs text-slate-500">Price includes VAT.</p>
        <AddToCartForm productId={product.id} maxQuantity={Math.min(product.available, MAX_QUANTITY_PER_ITEM)} />
      </div>
    </article>
  );
}
