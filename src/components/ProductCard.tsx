import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice, type ShopifyProduct } from "@/lib/shopify";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const p = product.node;
  const variant = p.variants.edges[0]?.node;
  const img = p.images.edges[0]?.node;

  const add = async () => {
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions,
    });
    toast.success("Προστέθηκε στο καλάθι", { description: p.title });
  };

  return (
    <article className="group flex flex-col">
      <Link to="/product/$handle" params={{ handle: p.handle }} className="block overflow-hidden rounded-md bg-muted shadow-soft">
        {img ? (
          <img src={img.url} alt={img.altText ?? p.title} loading="lazy" width={1000} height={1000} className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="aspect-square w-full" />
        )}
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3">
          <Link to="/product/$handle" params={{ handle: p.handle }} className="font-display text-lg leading-snug hover:text-primary">
            {p.title}
          </Link>
          <span className="shrink-0 font-semibold">
            {formatPrice(p.priceRange.minVariantPrice.amount, p.priceRange.minVariantPrice.currencyCode)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
        <Button variant="outline" className="mt-4" onClick={add} disabled={isLoading || !variant?.availableForSale}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : variant?.availableForSale === false ? "Εξαντλήθηκε" : "Προσθήκη στο καλάθι"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Δεν δεχόμαστε επιστροφές ·{" "}
          <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
            Όροι Χρήσης
          </Link>
        </p>

      </div>
    </article>
  );
}
