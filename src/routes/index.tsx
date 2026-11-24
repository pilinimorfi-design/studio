import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, ExternalLink, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { ReviewStarsWidget } from "@/components/ReviewStars";
import {
  getGoogleReviewUrl,
  getDeviceReview,
  getClientIpHash,
  submitDeviceReview,
} from "@/lib/reviews";
import { homeContentQuery, productsQuery, deviceReviewSummaryQuery } from "@/lib/queries";
import { CATEGORIES } from "@/lib/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useDeviceId } from "@/hooks/useDeviceId";
import { CookieBanner } from "@/components/CookieBanner";
import { useCookieConsent } from "@/lib/consent";

const ALL = "Όλα";
const PAGE_SIZE = 6;

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
  const deviceReviews = useQuery(deviceReviewSummaryQuery);
  const googleReviewUrl = getGoogleReviewUrl();
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();
  const [hasConsent, updateConsent] = useCookieConsent();
  const [homeModalDismissed, setHomeModalDismissed] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ipHash, setIpHash] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [category, setCategory] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("pilinimorfi_home_scroll");
    if (savedScroll && !products.isLoading && products.data) {
      window.scrollTo({ top: Number(savedScroll), behavior: "instant" });
      sessionStorage.removeItem("pilinimorfi_home_scroll");
    }
  }, [products.isLoading, products.data]);

  useEffect(() => {
    let mounted = true;
    getClientIpHash().then((hash) => {
      if (mounted) setIpHash(hash);
    });

    if (deviceId) {
      getDeviceReview(deviceId)
        .then((result) => {
          if (mounted) setUserRating(result.rating);
        })
        .catch(() => {});
    }

    return () => {
      mounted = false;
    };
  }, [deviceId]);

  const handleRate = async (rating: number) => {
    if (!deviceId) return;
    setSubmittingReview(true);
    try {
      const result = await submitDeviceReview({
        data: { deviceId, rating, ipHash: ipHash ?? undefined },
      });
      setUserRating(rating);
      if (result.averageRating !== null) {
        queryClient.setQueryData(deviceReviewSummaryQuery.queryKey, {
          averageRating: result.averageRating,
          reviewCount: result.reviewCount,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["reviews", "device-summary"] });
    } finally {
      setSubmittingReview(false);
    }
  };
  const productTypes = (products.data ?? [])
    .map((product) => product.productType)
    .filter((type): type is string => Boolean(type));
  // Helper to normalize synonymous category names
const normalizeCategory = (name: string): string => {
  const trimmed = name.trim().toLocaleLowerCase("el");
  if (trimmed === "βάζο") return "Βάζα";
  // Preserve original capitalization for other names
  return name;
};

// Build the list of categories, merging synonyms and removing duplicates
const rawCategories = [...new Set<string>([...CATEGORIES, ...productTypes])];
const categories = [...new Set<string>(rawCategories.map(normalizeCategory))];

// Filter visible products using normalized categories
const visible = (products.data ?? []).filter(
  (p) => {
    const prodCat = normalizeCategory(p.productType ?? "");
    return category === ALL || prodCat === category;
  },
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
          <p className="inline-block w-fit px-2 py-1.5 rounded-full border border-amber-200/50 bg-transparent backdrop-blur-[2px] text-amber-100 text-xs uppercase tracking-widest">
            {hero.eyebrow}
          </p>
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

      <section aria-labelledby="reviews-heading" className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-5 py-4 md:py-5 text-left">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between w-full">
            <div className="flex flex-col items-start gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-primary pl-[2px]">
                Η ΓΝΩΜΗ ΣΑΣ ΜΕΤΡΑΕΙ
              </p>
              <h2 id="reviews-heading" className="mt-0 font-display text-2xl md:text-3xl">
                Η εμπιστοσύνη σας μας εμπνέει
              </h2>
            </div>
            <div className="flex flex-col items-start gap-1">
              {deviceReviews.isPending ? (
                <p className="text-xs font-medium uppercase tracking-wider text-primary transition-opacity opacity-75 pl-[2px]">
                  ΑΞΙΟΛΟΓΗΣΤΕ ΜΑΣ
                </p>
              ) : deviceReviews.isError ? (
                <p role="alert" className="text-sm text-destructive pl-[2px]">
                  Δεν ήταν δυνατή η φόρτωση των αξιολογήσεων.
                </p>
              ) : (
                <p className="text-xs font-medium uppercase tracking-wider text-primary transition-opacity opacity-75 pl-[2px]">
                  ΑΞΙΟΛΟΓΗΣΤΕ ΜΑΣ
                </p>
              )}
              <div className="inline-flex items-center gap-2 mt-2.5">
                {!deviceReviews.isPending && !deviceReviews.isError && (
                  <ReviewStarsWidget
                    averageRating={deviceReviews.data?.averageRating ?? null}
                    reviewCount={deviceReviews.data?.reviewCount ?? 0}
                    userRating={userRating}
                    onRate={handleRate}
                    submitting={submittingReview}
                    showHint={false}
                    starsFirst
                    starSize="large"
                    ratingDisplay={true}
                  />
                )}
              </div>
            </div>
          </div>
          {googleReviewUrl && (
            <Button asChild variant="link" className="h-auto p-0 mt-4 md:mt-0 md:ml-auto">
              <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer">
                Αξιολογήστε μας στο Google
                <ExternalLink className="ml-1 size-4" aria-hidden="true" />
              </a>
            </Button>
          )}
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
          <label htmlFor="category" className="text-base font-bold text-primary">
            Κατηγορία:
          </label>
          <Select value={category} onValueChange={selectCategory}>
            <SelectTrigger id="category" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {[ALL, ...categories].map((c) => {
                const count =
                  c === ALL
                    ? (products.data?.length ?? 0)
                    : (products.data ?? []).filter((p) => normalizeCategory(p.productType ?? "") === c).length;
                return (
                  <SelectItem
                    key={c}
                    value={c}
                    className="focus:bg-primary focus:text-primary-foreground"
                  >
                    {c} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        {products.isLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
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
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
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
                    className={
                      n === currentPage
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
                    }
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
                  className="hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors"
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
                className="inline-block align-middle overflow-hidden rounded-full border border-primary transition-all duration-200 hover:scale-105 hover:opacity-90 hover:shadow-md"
              >
                <img
                  src="/spin.png"
                  alt={about.sponsor.name}
                  className="h-3.5 w-auto overflow-hidden rounded-full"
                />
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
      {!hasConsent && !homeModalDismissed && (
        <CookieBanner
          open
          onClose={() => setHomeModalDismissed(true)}
          showCookiePolicyLink={true}
          linkHref="/cookies?from=modal"
          message={
            <div className="space-y-2">
              <div>
                <div>Καλώς ήρθατε στο εργαστήριο αγγειοπλαστικής</div>
                <div className="font-bold text-primary mt-0.5">
                  «Πήλινη Μορφή»
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                Χρησιμοποιούμε μόνο τα απολύτως απαραίτητα τεχνικά στοιχεία για τη λειτουργία του ιστότοπου και του καλαθιού, χωρίς cookies παρακολούθησης ή διαφήμισης.
              </p>
            </div>
          }
          primaryLabel="Αποδοχή"
          primaryVariant="default"
          primaryOnClick={() => updateConsent(true)}
          secondaryLabel="Συνέχεια χωρίς αποθήκευση"
          secondaryVariant="outline"
          secondaryOnClick={() => setHomeModalDismissed(true)}
        />
      )}
    </>
  );
}
