import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductAttributes } from "@/components/ProductAttributes";
import { productQuery, productDetailsQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/product/$handle")({
  head: () => ({
    meta: [
      { title: "Προϊόν — Πήλινη Μορφή" },
      { name: "description", content: "Χειροποίητο κεραμικό από το εργαστήριο Πήλινη Μορφή." },
      { property: "og:title", content: "Προϊόν — Πήλινη Μορφή" },
      {
        property: "og:description",
        content: "Χειροποίητο κεραμικό από το εργαστήριο Πήλινη Μορφή.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(handle));
  const { data: details } = useQuery(productDetailsQuery);
  const addItem = useCartStore((state) => state.addItem);
  const cartLoading = useCartStore((state) => state.isLoading);

  if (isLoading)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (!product)
    return <div className="py-32 text-center text-muted-foreground">Το προϊόν δεν βρέθηκε.</div>;

  const p = product;
  async function addToCart() {
    try {
      await addItem(p);
      toast.success("Προστέθηκε στο καλάθι", { description: p.title });
    } catch {
      toast.error("Δεν ήταν δυνατή η προσθήκη στο καλάθι.");
    }
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
          <Button
            size="lg"
            className="mt-6"
            onClick={() => void addToCart()}
            disabled={cartLoading}
          >
            Προσθήκη στο καλάθι
          </Button>
          <section className="mt-6">
            <h2 className="font-display text-xl">Περιγραφή</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
              {p.description}
            </p>
          </section>

          {(typeof p.weightGrams === "number" ||
            Boolean(p.dimensions?.trim()) ||
            p.glazed != null ||
            p.fired != null ||
            p.homeUse != null) && (
            <section className="mt-10 border-t pt-6">
              <h2 className="font-display text-xl">Χαρακτηριστικά</h2>
              <div className="mt-3">
                <ProductAttributes product={p} />
              </div>
            </section>
          )}
          <section className="mt-6 border-t pt-6">
            <h2 className="font-display text-xl">Οδηγίες φροντίδας</h2>
            {p.care ? (
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{p.care}</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {details?.care.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
