import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, isLoading, error, loadCart, updateQuantity, removeItem } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.product.price.amount) * item.quantity,
    0,
  );

  useEffect(() => {
    if (open) void loadCart();
  }, [open, loadCart]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Καλάθι">
          <ShoppingBag className="size-5" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Το καλάθι σας</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Το καλάθι είναι άδειο" : `${totalItems} τεμάχια`}
          </SheetDescription>
        </SheetHeader>
        {error && (
          <p role="alert" className="px-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <ShoppingBag className="size-10 opacity-40" />
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3">
                  <div className="size-16 shrink-0 overflow-hidden rounded bg-muted">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.title}</p>
                    <p className="text-sm font-semibold">
                      {formatPrice(product.price.amount, product.price.currencyCode)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => void removeItem(product.id).catch(() => undefined)}
                      disabled={isLoading}
                      aria-label={`Αφαίρεση ${product.title}`}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-6"
                        onClick={() =>
                          void updateQuantity(product.id, quantity - 1).catch(() => undefined)
                        }
                        disabled={isLoading}
                        aria-label="Μείωση ποσότητας"
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-6"
                        onClick={() =>
                          void updateQuantity(product.id, quantity + 1).catch(() => undefined)
                        }
                        disabled={isLoading || quantity >= 20}
                        aria-label="Αύξηση ποσότητας"
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4 border-t p-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Μερικό σύνολο</span>
                <span>{formatPrice(totalPrice.toString(), "EUR")}</span>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link to="/checkout" onClick={() => setOpen(false)}>
                  Συνέχεια στο ταμείο
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Τα έξοδα αποστολής υπολογίζονται στο ταμείο.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
