import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { ProductAttributes } from "@/components/ProductAttributes";
import { useCartStore } from "@/stores/cartStore";

import { formatPrice, type CatalogProduct } from "@/lib/shopify";
import { ShareProductButton } from "@/components/ShareProductButton";
import { hasCookieConsent, requestCookieConsent } from "@/lib/consent";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const image = product.imageUrl;
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);
  const cartItems = useCartStore((state) => state.items);

  const cartItem = cartItems.find((item) => item.product.id === product.id);
  const cartQuantity = cartItem?.quantity ?? 0;
  const atMaxStock = cartQuantity >= product.stock;

  async function addToCart() {
    if (!hasCookieConsent()) {
      requestCookieConsent(async () => {
        try {
          await addItem(product);
          toast.success("Προστέθηκε στο καλάθι", { description: product.title });
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Δεν ήταν δυνατή η προσθήκη στο καλάθι.",
          );
        }
      });
      return;
    }
    try {
      await addItem(product);
      toast.success("Προστέθηκε στο καλάθι", { description: product.title });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Δεν ήταν δυνατή η προσθήκη στο καλάθι.",
      );
    }
  }

  async function buyNow() {
    if (!hasCookieConsent()) {
      requestCookieConsent(async () => {
        const alreadyInCart = cartItems.some((item) => item.product.id === product.id);
        if (!alreadyInCart) {
          await addItem(product);
        }
        navigate({ to: "/checkout" });
      });
      return;
    }
    const alreadyInCart = cartItems.some((item) => item.product.id === product.id);
    if (!alreadyInCart) {
      await addItem(product);
    }
    navigate({ to: "/checkout" });
  }

  function saveScrollAndNavigate() {
    try {
      sessionStorage.setItem("pilinimorfi_home_scroll", String(window.scrollY));
    } catch {
      // ignore
    }
  }

  return (<>

    <article className="product-card group relative flex h-full flex-col border-[#C27D5E]/50 hover:border-[#C27D5E] border-[1px] rounded-xl bg-transparent p-4 shadow-soft">
      <Link
        to="/product/$handle"
        params={{ handle: product.handle }}
        tabIndex={-1}
        aria-hidden="true"
        onClick={saveScrollAndNavigate}
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
        <div className="flex min-h-12 items-baseline justify-between gap-3">
          <Link
            to="/product/$handle"
            params={{ handle: product.handle }}
            onClick={saveScrollAndNavigate}
            className="font-display text-lg leading-snug after:absolute after:inset-0 after:content-[''] hover:text-primary"
          >
            {product.title}
          </Link>
          <span className="shrink-0 font-semibold">
            {formatPrice(product.price.amount, product.price.currencyCode)}
          </span>
        </div>
        <div className="mt-1 min-h-10 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </div>
        <div className="mt-2">
          <ShareProductButton product={product} className="relative z-10" />
          <ProductAttributes product={product} />
        </div>
        <div className="mt-auto flex flex-col gap-1 pt-4">
          <Button
            variant="default"
            className="relative z-10 border border-input bg-background text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm add-to-cart-btn"
            onClick={() => void addToCart()}
            disabled={isLoading || product.stock <= 0 || atMaxStock}
          >
            {atMaxStock ? "Βρίσκεται στο καλάθι" : "Προσθήκη στο καλάθι"}
          </Button>
          <Button
            variant="default"
            className="relative z-10 h-8 border border-input bg-background text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm buy-now-btn"
            onClick={() => void buyNow()}
            disabled={isLoading || product.stock <= 0}
          >
            Αγορά Τώρα
          </Button>
        </div>
      </div>
    </article>
  </>
  );
}
