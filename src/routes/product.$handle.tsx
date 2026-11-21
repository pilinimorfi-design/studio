import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductAttributes } from "@/components/ProductAttributes";
import { productQuery, productDetailsQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/product/$handle")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.handle)),
  head: ({ loaderData }) => {
    const title = loaderData?.title
      ? `${loaderData.title} | Πήλινη Μορφή`
      : "Προϊόν — Πήλινη Μορφή";
    const descriptionText = loaderData
      ? `${loaderData.title}${loaderData.productType ? ` — ${loaderData.productType}.` : "."} ${loaderData.description}`
      : "Χειροποίητο κεραμικό από το εργαστήριο Πήλινη Μορφή.";
    const description =
      descriptionText.length > 160
        ? `${descriptionText.slice(0, 157).trimEnd()}...`
        : descriptionText;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(handle));
  const { data: details } = useQuery(productDetailsQuery);
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const cartLoading = useCartStore((state) => state.isLoading);
  const cartItems = useCartStore((state) => state.items);

  if (isLoading)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (!product)
    return <div className="py-32 text-center text-muted-foreground">Το προϊόν δεν βρέθηκε.</div>;

  const p = product;
  const cartItem = cartItems.find((item) => item.product.id === p.id);
  const cartQuantity = cartItem?.quantity ?? 0;
  const atMaxStock = cartQuantity >= p.stock;

  async function addToCart() {
    try {
      await addItem(p);
      toast.success("Προστέθηκε στο καλάθι", { description: p.title });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Δεν ήταν δυνατή η προσθήκη στο καλάθι.",
      );
    }
  }

  async function buyNow() {
    const alreadyInCart = cartItems.some((item) => item.product.id === p.id);
    if (!alreadyInCart) {
      await addItem(p);
    }
    navigate({ to: "/checkout" });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Πίσω
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-md bg-muted">
            {p.imageUrl && (
              <img src={p.imageUrl} alt={p.title} className="aspect-square w-full object-cover" />
            )}
          </div>
        </div>
        <div>
          <h1 className="font-display text-4xl">{p.title}</h1>
          <p className="mt-3 text-2xl font-semibold">
            {formatPrice(p.price.amount, p.price.currencyCode)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {p.productType && <>Κατηγορία: {p.productType}</>}
            {" · "}Κωδικός: {p.sku}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {p.stock > 0 ? `Απόθεμα: ${p.stock} τεμάχια` : "Εξαντλημένο"}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="text-sm disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
              onClick={() => void addToCart()}
              disabled={cartLoading || p.stock <= 0 || atMaxStock}
            >
              {atMaxStock ? "Βρίσκεται στο καλάθι" : "Προσθήκη στο καλάθι"}
            </Button>
            <Button
              size="lg"
              className="text-sm disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
              onClick={() => void buyNow()}
              disabled={cartLoading || p.stock <= 0}
            >
              Αγορά Τώρα
            </Button>
          </div>
          <section className="mt-6">
            <h2 className="font-display text-xl">Περιγραφή</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
              {p.description}
            </p>
          </section>

          {(typeof p.weightGrams === "number" ||
            p.heightCm != null ||
            p.lengthCm != null ||
            p.widthCm != null ||
            p.glazed != null ||
            p.homeUse != null) && (
            <section className="mt-10 border-t pt-6">
              <h2 className="font-display text-xl">Χαρακτηριστικά</h2>
              <div className="mt-3">
                <ProductAttributes product={p} />
                {(p.heightCm != null || p.lengthCm != null || p.widthCm != null) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Οι διαστάσεις υπολογίζονται μαζί με τη συσκευασία αποστολής.
                  </p>
                )}
              </div>
            </section>
          )}
          <section className="mt-6 border-t pt-6">
            <h2 className="font-display text-xl">Οδηγίες φροντίδας</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
              {(p.care
                ? p.care.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
                : details?.care ?? []
              ).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
