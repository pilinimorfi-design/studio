import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Loader2, Star, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { getOrderConfirmation } from "@/lib/orders";
import { getGoogleReviewUrl, submitOrderReview } from "@/lib/reviews";
import { StarRatingPicker } from "@/components/ReviewStars";
import logo from "@/assets/logo-pilinimorfi.png";
import { ReviewModal } from "@/components/ReviewModal";

const searchSchema = z.object({ orderId: z.string().uuid().optional() });

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Επιβεβαίωση παραγγελίας — Πήλινη Μορφή" },
      { name: "description", content: "Κατάσταση καταχώρισης και πληρωμής παραγγελίας." },
    ],
  }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { orderId } = Route.useSearch();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  useEffect(() => setSelectedRating(null), [orderId]);
  const confirmation = useQuery({
    queryKey: ["order-confirmation", orderId],
    queryFn: () => {
      if (!orderId) throw new Error("Λείπει ο αριθμός αναφοράς παραγγελίας.");
      return getOrderConfirmation({ data: { orderId } });
    },
    enabled: Boolean(orderId),
    retry: false,
  });
  useEffect(() => {
    if (confirmation.data?.payment_status === "paid") {
      setReviewModalOpen(true);
    }
  }, [confirmation.data?.payment_status]);
  const review = useMutation({
    mutationFn: (rating: number) => {
      if (!orderId) throw new Error("Λείπει ο αριθμός αναφοράς παραγγελίας.");
      return submitOrderReview({ data: { orderId, rating } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order-confirmation", orderId] }),
  });

  const isPaid = confirmation.data?.payment_status === "paid";
  const googleReviewUrl = getGoogleReviewUrl();

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      {confirmation.isLoading ? (
        <>
          <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground" />
          <h1 className="mt-5 font-display text-3xl">Έλεγχος παραγγελίας</h1>
          <p className="mt-2 text-muted-foreground">Ελέγχουμε την κατάσταση της πληρωμής.</p>
        </>
      ) : isPaid ? (
        <>
          <CheckCircle2 className="mx-auto size-12 text-primary" />
          <p className="mt-5 flex items-center justify-center gap-2 font-display text-lg font-semibold">
            <img src={logo} alt="" aria-hidden="true" className="size-10 object-contain" />
            <span>Πήλινη Μορφή</span>
          </p>
          <h1 className="mt-5 font-display text-3xl">Η παραγγελία σας επιβεβαιώθηκε</h1>
          {confirmation.data?.is_test && (
            <p className="mt-3 rounded-md border border-amber-500/40 bg-secondary px-4 py-3 text-sm font-medium">
              Δοκιμαστική παραγγελία — δεν πραγματοποιήθηκε πραγματική χρέωση.
            </p>
          )}
          <p className="mt-3 text-muted-foreground">
            Η πληρωμή ολοκληρώθηκε και η παραγγελία καταχωρίστηκε επιτυχώς.
          </p>
          <p className="mt-4 font-medium">Αριθμός παραγγελίας: {confirmation.data?.order_number}</p>
          {!confirmation.data?.is_test && (
            <section className="mt-10 rounded-lg border border-border bg-card p-6 text-left shadow-soft">
              <h2 className="font-display text-2xl">Πώς ήταν η εμπειρία σας;</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Η ειλικρινής αξιολόγησή σας βοηθά άλλους να γνωρίσουν το εργαστήριό μας.
              </p>
              {confirmation.data?.review_rating ? (
                <p role="status" className="mt-5 flex items-center gap-2 font-medium">
                  <Star className="size-5 fill-amber-500 text-amber-500" aria-hidden="true" />
                  Ευχαριστούμε για την αξιολόγησή σας!
                </p>
              ) : (
                <div className="mt-5">
                  <StarRatingPicker
                    value={selectedRating}
                    onChange={setSelectedRating}
                    disabled={review.isPending}
                  />
                  <Button
                    type="button"
                    className="mt-4"
                    disabled={selectedRating === null || review.isPending}
                    onClick={() => selectedRating !== null && review.mutate(selectedRating)}
                  >
                    {review.isPending ? "Αποθήκευση..." : "Υποβολή αξιολόγησης"}
                  </Button>
                  {review.isError && (
                    <p role="alert" className="mt-3 text-sm text-destructive">
                      {review.error.message}
                    </p>
                  )}
                </div>
              )}
              {googleReviewUrl && (
                <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                  Αν θέλετε, μοιραστείτε δημόσια την εμπειρία σας και στο{" "}
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4"
                  >
                    Google <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                  .
                </p>
              )}
            </section>
          )}
        </>
      ) : confirmation.isError ? (
        <>
          <TriangleAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-5 font-display text-3xl">Δεν ήταν δυνατή η επιβεβαίωση</h1>
          <p role="alert" className="mt-3 text-muted-foreground">
            Δεν μπορέσαμε να ελέγξουμε την κατάσταση της παραγγελίας. Επικοινωνήστε μαζί μας πριν
            επαναλάβετε την πληρωμή.
          </p>
        </>
      ) : (
        <>
          <TriangleAlert className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-5 font-display text-3xl">
            {confirmation.data?.is_test && confirmation.data.payment_status === "failed"
              ? "Η δοκιμαστική πληρωμή απέτυχε"
              : orderId
                ? "Η πληρωμή δεν έχει επιβεβαιωθεί"
                : "Δεν βρέθηκε παραγγελία"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {confirmation.data?.is_test && confirmation.data.payment_status === "failed"
              ? "Δεν πραγματοποιήθηκε πραγματική χρέωση. Μπορείτε να επιστρέψετε στο κατάστημα και να επαναλάβετε τη δοκιμή."
              : orderId && confirmation.data
                ? "Η παραγγελία υπάρχει, αλλά η πληρωμή δεν έχει επιβεβαιωθεί ακόμη. Δεν θεωρείται ολοκληρωμένη."
                : "Η σελίδα αυτή εμφανίζει επιβεβαίωση μόνο για παραγγελία που έχει καταχωριστεί και πληρωμή που έχει επιβεβαιωθεί."}
          </p>
        </>
      )}
      <Button asChild variant="outline" className="mt-8">
        <Link to="/">Επιστροφή στο κατάστημα</Link>
      </Button>
      <ReviewModal open={reviewModalOpen} onOpenChange={setReviewModalOpen} />
    </div>
  );
}
