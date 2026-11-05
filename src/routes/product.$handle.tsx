import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { productQuery, productDetailsQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/product/$handle")({
  head: () => ({
    meta: [
      { title: "Προϊόν — Πήλινη Μορφή" },
      { name: "description", content: "Χειροποίητο κεραμικό από το εργαστήριο Πήλινη Μορφή." },
      { property: "og:title", content: "Προϊόν — Πήλινη Μορφή" },
      { property: "og:description", content: "Χειροποίητο κεραμικό από το εργαστήριο Πήλινη Μορφή." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(handle));
  const addItem = useCartStore((s) => s.addItem);
  const cartLoading = useCartStore((s) => s.isLoading);
  const [variantIdx, setVariantIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);
  const { data: details } = useQuery(productDetailsQuery);

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!product) return <div className="py-32 text-center text-muted-foreground">Το προϊόν δεν βρέθηκε.</div>;

  const p = product.node;
  const variants = p.variants.edges.map((e) => e.node);
  const variant = variants[variantIdx];
  const images = p.images.edges.map((e) => e.node);

  const add = async () => {
    if (!variant) return;
    await addItem({ product, variantId: variant.id, variantTitle: variant.title, price: variant.price, quantity: 1, selectedOptions: variant.selectedOptions });
    toast.success("Προστέθηκε στο καλάθι", { description: p.title });
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Πίσω</Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-md bg-muted">
            {images[imgIdx] && <img src={images[imgIdx].url} alt={images[imgIdx].altText ?? p.title} className="aspect-square w-full object-cover" />}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((im, i) => (
                <button key={im.url} onClick={() => setImgIdx(i)} className={`h-16 w-16 overflow-hidden rounded border-2 ${i === imgIdx ? "border-primary" : "border-transparent"}`}>
                  <img src={im.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-4xl">{p.title}</h1>
          {variant && <p className="mt-3 text-2xl font-semibold">{formatPrice(variant.price.amount, variant.price.currencyCode)}</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            {p.productType && <>Κατηγορία: {p.productType}</>}
            {variant?.sku && <> · Κωδικός: {variant.sku}</>}
          </p>
          <section className="mt-6">
            <h2 className="font-display text-xl">Περιγραφή</h2>
            {p.descriptionHtml ? (
              <div className="mt-2 space-y-3 leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: p.descriptionHtml }} />
            ) : (
              <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">{p.description}</p>
            )}
          </section>
          {variants.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {variants.map((v, i) => (
                <Button key={v.id} variant={i === variantIdx ? "default" : "outline"} size="sm" onClick={() => setVariantIdx(i)}>{v.title}</Button>
              ))}
            </div>
          )}
          {variant?.availableForSale === false ? (
            <p className="mt-8 text-sm font-medium text-muted-foreground">Εξαντλήθηκε</p>
          ) : (
            <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={add} disabled={cartLoading}>
              {cartLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Προσθήκη στο καλάθι"}
            </Button>
          )}

          <section className="mt-10 border-t pt-6">
            <h2 className="font-display text-xl">Διαστάσεις</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{p.dimensions?.value || details?.dimensionsFallback}</p>
          </section>
          <section className="mt-6 border-t pt-6">
            <h2 className="font-display text-xl">Οδηγίες φροντίδας</h2>
            {p.care?.value ? (
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{p.care.value}</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {details?.care.map((c) => <li key={c}>{c}</li>)}
              </ul>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
