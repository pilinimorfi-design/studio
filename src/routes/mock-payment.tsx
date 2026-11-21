import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, TriangleAlert } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { resolveSimulatedPayment } from "@/lib/orders";
import { useCartStore } from "@/stores/cartStore";

const CHECKOUT_DRAFT_KEY = "pilinimorfi_checkout_draft";

function clearCheckoutDraft() {
  try {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch {
    // ignore
  }
}

const searchSchema = z.object({ orderId: z.string().uuid().optional() });

export const Route = createFileRoute("/mock-payment")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Δοκιμαστική πληρωμή — Πήλινη Μορφή" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MockPaymentPage,
});

function MockPaymentPage() {
  const { orderId } = Route.useSearch();
  const clearLocalCart = useCartStore((state) => state.clearLocalCart);
  const mutation = useMutation({
    mutationFn: (result: "success" | "failure") => {
      if (!orderId) throw new Error("Δεν βρέθηκε δοκιμαστική παραγγελία.");
      return resolveSimulatedPayment({ data: { orderId, result } });
    },
    onSuccess: ({ redirectUrl }) => window.location.assign(redirectUrl),
  });

  if (!import.meta.env.DEV) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <TriangleAlert className="mx-auto size-10 text-destructive" />
        <h1 className="mt-5 font-display text-3xl">Η δοκιμαστική πληρωμή δεν είναι διαθέσιμη</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-20">
      <div className="rounded-lg border border-amber-500/40 bg-card p-6 shadow-soft md:p-8">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-700">
          <CreditCard className="size-4" />
          Εικονικό περιβάλλον πληρωμών
        </p>
        <h1 className="mt-4 font-display text-3xl">Δοκιμαστική πληρωμή</h1>
        <p className="mt-3 text-muted-foreground">
          Δεν συνδεόμαστε με EveryPay, δεν ζητούνται στοιχεία κάρτας και δεν πραγματοποιείται
          χρέωση. Επίλεξε ένα αποτέλεσμα για να ελέγξεις τη ροή επιστροφής.
        </p>
        {!orderId && (
          <p role="alert" className="mt-5 text-sm text-destructive">
            Δεν υπάρχει αναγνωριστικό δοκιμαστικής παραγγελίας.
          </p>
        )}
        {mutation.isError && (
          <p role="alert" className="mt-5 text-sm text-destructive">
            {mutation.error.message}
          </p>
        )}
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            disabled={!orderId || mutation.isPending}
            onClick={() => {
              clearLocalCart();
              clearCheckoutDraft();
              mutation.mutate("success");
            }}
          >
            <CheckCircle2 className="mr-2 size-4" />
            Προσομοίωση επιτυχίας
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!orderId || mutation.isPending}
            onClick={() => mutation.mutate("failure")}
          >
            <TriangleAlert className="mr-2 size-4" />
            Προσομοίωση αποτυχίας
          </Button>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/checkout" className="underline underline-offset-4">
            Επιστροφή στο ταμείο
          </Link>
        </p>
      </div>
    </div>
  );
}
