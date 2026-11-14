import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductAttributes } from "@/components/ProductAttributes";
import { useCartStore } from "@/stores/cartStore";

import { formatPrice, type CatalogProduct } from "@/lib/shopify";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const image = product.imageUrl;
  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);

  async function addToCart() {
    try {
      await addItem(product);
      toast.success("Προστέθηκε στο καλάθι", { description: product.title });
    } catch {
      toast.error("Δεν ήταν δυνατή η προσθήκη στο καλάθι.");
    }
  }

  return (
    <article className="group relative flex flex-col">
      <Link
        to="/product/$handle"
        params={{ handle: product.handle }}
        tabIndex={-1}
        aria-hidden="true"
        className="block overflow-hidden rounded-md bg-muted shadow-soft"
      >
        {image ? (
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            width={1000}
            height={1000}
            className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-square w-full" />
        )}
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <Link
            to="/product/$handle"
            params={{ handle: product.handle }}
            className="font-display text-lg leading-snug after:absolute after:inset-0 after:content-[''] hover:text-primary"
          >
            {product.title}
          </Link>
          <span className="shrink-0 font-semibold">
            {formatPrice(product.price.amount, product.price.currencyCode)}
          </span>
        </div>
        {product.productType && (
          <p className="mt-1 text-sm text-muted-foreground">{product.productType}</p>
        )}
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-2">
          <ProductAttributes product={product} compact />
        </div>
        <Button
          variant="outline"
          className="relative z-10 mt-4"
          onClick={() => void addToCart()}
          disabled={isLoading}
        >
          Προσθήκη στο καλάθι
        </Button>
      </div>
    </article>
  );
}
