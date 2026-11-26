import Image from "next/image";
import type { Product } from "@/lib/products";

/** Product image (local WebP/SVG, already 320px) with a brand-initials fallback when none is seeded. */
export function ProductImage({ product, size, preload = false }: { product: Product; size: number; preload?: boolean }) {
  if (!product.imageUrl) {
    return (
      <div aria-hidden className="flex items-center justify-center rounded bg-slate-100 text-3xl font-bold text-slate-400" style={{ height: size }}>
        {product.brand.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center rounded bg-white" style={{ height: size }}>
      <Image
        src={product.imageUrl}
        alt={product.imageAlt ?? product.name}
        width={size}
        height={size}
        // Files are pre-sized and compressed by scripts/build-product-images.ts; SVGs cannot go through the optimizer.
        unoptimized
        preload={preload}
        className="h-full w-auto object-contain"
        data-testid="product-image"
      />
    </div>
  );
}
