import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { homeContentQuery, productsQuery } from "@/lib/queries";
import { CATEGORIES } from "@/lib/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const ALL = "Όλα";
const PAGE_SIZE = 8;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Πήλινη Μορφή — Χειροποίητα κεραμικά" },
      {
        name: "description",
        content:
          "Χειροποίητα κεραμικά από το εργαστήριο Πήλινη Μορφή και σεμινάρια αγγειοπλαστικής δια ζώσης και online.",
      },
      { property: "og:title", content: "Πήλινη Μορφή — Χειροποίητα κεραμικά" },
      {
        property: "og:description",
        content: "Χειροποίητα κεραμικά και σεμινάρια αγγειοπλαστικής.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeContentQuery),
  component: Index,
});

function Index() {
  const { data: content } = useSuspenseQuery(homeContentQuery);
  const { hero, about, seminarsStatus, seminarsCta } = content;
  const products = useQuery(productsQuery);
  const [category, setCategory] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const productTypes = (products.data ?? [])
    .map((product) => product.productType)
    .filter((type): type is string => Boolean(type));
  const categories = [...new Set<string>([...CATEGORIES, ...productTypes])];
  const visible = (products.data ?? []).filter(
    (p) => category === ALL || p.productType === category,
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selectCategory = (c: string) => {
    setCategory(c);
    setPage(1);
  };

  const goToPage = (n: number) => {
    setPage(n);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <img
          src={hero.image}
          alt=""
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-clay-deep/80 via-clay-deep/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end px-5 pb-14 pt-24 text-clay-deep-foreground md:justify-center">
          <p className="text-xs uppercase tracking-[0.25em] opacity-80">{hero.eyebrow}</p>
          <h1 className="mt-3 max-w-xl font-display text-5xl font-medium leading-[1.05] md:text-7xl">
            {hero.title}
          </h1>
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
        <p className="mb-6 text-sm text-muted-foreground">
          Προσθέστε τα αγαπημένα σας στο καλάθι και συνεχίστε στο ταμείο.
        </p>
        <div className="mb-10 flex items-center gap-3">
          <label htmlFor="category" className="text-sm text-muted-foreground">
            Κατηγορία
          </label>
          <Select value={category} onValueChange={selectCategory}>
            <SelectTrigger id="category" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[ALL, ...categories].map((c) => {
                const count =
                  c === ALL
                    ? (products.data?.length ?? 0)
                    : (products.data ?? []).filter((p) => p.productType === c).length;
                return (
                  <SelectItem key={c} value={c}>
                    {c} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        {products.isLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : products.isError ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 p-6 text-center text-destructive"
          >
            Δεν ήταν δυνατή η φόρτωση του καταλόγου. Δοκιμάστε ξανά αργότερα.
          </div>
        ) : visible.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {paged.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {pageCount > 1 && (
              <nav
                aria-label="Σελιδοποίηση προϊόντων"
                className="mt-12 flex items-center justify-center gap-2"
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Προηγούμενη σελίδα"
                >
                  <ChevronLeft />
                </Button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    variant={n === currentPage ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(n)}
                    aria-label={`Σελίδα ${n}`}
                    aria-current={n === currentPage ? "page" : undefined}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                  aria-label="Επόμενη σελίδα"
                >
                  <ChevronRight />
                </Button>
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-md border border-dashed py-16 text-center text-muted-foreground">
            Δεν βρέθηκαν προϊόντα ακόμη.
          </div>
        )}
      </section>

      <section className="bg-secondary">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
          <img
            src={about.image}
            alt="Χέρια που πλάθουν πηλό στον τροχό"
            loading="lazy"
            width={1008}
            height={1200}
            className="aspect-[4/5] w-full rounded-md object-cover shadow-soft"
          />
          <div>
            <h2 className="font-display text-3xl md:text-4xl">{about.title}</h2>
            {about.paragraphs.map((t, i) => (
              <p key={i} className="mt-5 leading-relaxed text-secondary-foreground/85">
                {t}
              </p>
            ))}
            <p className="mt-8 border-t border-border pt-5 leading-relaxed text-secondary-foreground/85">
              Ευχαριστούμε το{" "}
              <a
                href={about.sponsor.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {about.sponsor.name}
              </a>{" "}
              για την ευγενή χορηγία στα πρώτα μας βήματα.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="font-display text-3xl md:text-4xl">{seminarsCta.title}</h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{seminarsCta.subtitle}</p>
        {!seminarsStatus.available && (
          <div className="mx-auto mt-6 max-w-lg rounded-md border border-primary/25 bg-secondary px-5 py-4">
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              {seminarsStatus.notice}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Για ενημέρωση όταν ξεκινήσουν ξανά, καλέστε στο{" "}
              <a
                href={seminarsStatus.contact.phoneHref}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {seminarsStatus.contact.phone}
              </a>
              .
            </p>
          </div>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/seminars" hash="in-person">
              <MapPin />
              Σεμινάρια δια ζώσης
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/seminars" hash="online">
              <Video />
              Online σεμινάρια μέσω video
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
