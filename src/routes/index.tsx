import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { homeContentQuery, productsQuery } from "@/lib/queries";
import { CATEGORIES } from "@/lib/categories";
import { useState } from "react";

const ALL = "Όλα";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Πήλινη Μορφή — Χειροποίητα κεραμικά" },
      { name: "description", content: "Χειροποίητα κεραμικά από το εργαστήριο Πήλινη Μορφή και σεμινάρια αγγειοπλαστικής δια ζώσης και online." },
      { property: "og:title", content: "Πήλινη Μορφή — Χειροποίητα κεραμικά" },
      { property: "og:description", content: "Χειροποίητα κεραμικά και σεμινάρια αγγειοπλαστικής." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeContentQuery),
  component: Index,
});

function Index() {
  const { data: content } = useSuspenseQuery(homeContentQuery);
  const { hero, about } = content;
  const products = useQuery(productsQuery);
  const [category, setCategory] = useState<string>(ALL);
  const visible = (products.data ?? []).filter((p) => category === ALL || p.node.productType === category);

  return (
    <>
      <section className="relative overflow-hidden">
        <img src={hero.image} alt="" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-clay-deep/80 via-clay-deep/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end px-5 pb-14 pt-24 text-clay-deep-foreground md:justify-center">
          <p className="text-xs uppercase tracking-[0.25em] opacity-80">{hero.eyebrow}</p>
          <h1 className="mt-3 max-w-xl font-display text-5xl font-medium leading-[1.05] md:text-7xl">{hero.title}</h1>
          <p className="mt-5 max-w-md text-base opacity-90 md:text-lg">{hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#products">Δείτε τα προϊόντα</a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/seminars">Σεμινάρια</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl md:text-4xl">Τα κεραμικά μας</h2>
        </div>
        <div className="mb-10 flex flex-wrap gap-2">
          {[ALL, ...CATEGORIES].map((c) => {
            const count = c === ALL ? products.data?.length ?? 0 : (products.data ?? []).filter((p) => p.node.productType === c).length;
            return (
              <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>
                {c} <span className="opacity-60">({count})</span>
              </Button>
            );
          })}
        </div>
        {products.isLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ProductCard key={p.node.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed py-16 text-center text-muted-foreground">
            Δεν βρέθηκαν προϊόντα ακόμη.
          </div>
        )}
      </section>

      <section className="bg-secondary">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
          <img src={about.image} alt="Χέρια που πλάθουν πηλό στον τροχό" loading="lazy" width={1008} height={1200} className="aspect-[4/5] w-full rounded-md object-cover shadow-soft" />
          <div>
            <h2 className="font-display text-3xl md:text-4xl">{about.title}</h2>
            {about.paragraphs.map((t, i) => (
              <p key={i} className="mt-5 leading-relaxed text-secondary-foreground/85">{t}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="font-display text-3xl md:text-4xl">Μάθετε αγγειοπλαστική</h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Στο εργαστήριο ή από το σπίτι σας, μέσω video.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/seminars" hash="in-person"><MapPin />Σεμινάρια δια ζώσης</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/seminars" hash="online"><Video />Online σεμινάρια μέσω video</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
