import type { Metadata } from "next";
import Link from "next/link";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { ProductImage } from "@/components/ProductImage";
import { CATEGORIES, isCategory, listProducts } from "@/lib/products";
import { formatEur } from "@/lib/money";

export const metadata: Metadata = { title: "Catalog | Smartphone Shop" };

const CATEGORY_LABELS: Record<string, string> = {
  smartphone: "Smartphones",
  case: "Cases",
  charger: "Chargers",
  cable: "Cables",
  headphones: "Headphones",
  screen_protector: "Screen protectors",
};

export default async function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const category = isCategory(params.category) ? params.category : undefined;
  const products = await listProducts({ q: q || undefined, category });

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Catalog</h1>

      <form role="search" className="mb-6 flex flex-wrap items-end gap-3" data-testid="catalog-filters">
        <div>
          <label htmlFor="q" className="mb-1 block text-sm font-medium">Search</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="e.g. iPhone" className="rounded border border-slate-300 px-3 py-2" data-testid="search-input" />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label>
          <select id="category" name="category" defaultValue={category ?? ""} className="rounded border border-slate-300 px-3 py-2" data-testid="category-select">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700" data-testid="search-button">
          Apply
        </button>
        {(q || category) && (
          <Link href="/catalog" className="py-2 text-sm text-indigo-700 hover:underline" data-testid="clear-filters">
            Clear filters
          </Link>
        )}
      </form>

      <p className="mb-4 text-sm text-slate-500" data-testid="results-count">
        {products.length} product{products.length === 1 ? "" : "s"}
      </p>

      {products.length === 0 ? (
        <p data-testid="no-results">No products match your search.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="product-list">
          {products.map((product, index) => (
              <li key={product.id} className="rounded border border-slate-200 bg-white p-4 shadow-sm" data-testid="product-card" data-product-id={product.id}>
                <div className="mb-3">
                  <ProductImage product={product} size={128} preload={index < 3} />
                </div>
                <p className="text-xs uppercase text-slate-500" data-testid="product-brand">{product.brand}</p>
                <h2 className="font-semibold">
                  <Link href={`/product/${product.id}`} className="hover:underline" data-testid="product-name">{product.name}</Link>
                </h2>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold" data-testid="product-price">{formatEur(product.priceCents)}</span>
                  <AvailabilityBadge availability={product.availability} />
                </div>
              </li>
          ))}
        </ul>
      )}
    </section>
  );
}
