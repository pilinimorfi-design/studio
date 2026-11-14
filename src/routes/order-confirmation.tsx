import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { getOrderConfirmation } from "@/lib/orders";
import logo from "@/assets/logo-pilinimorfi.png";

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
  const confirmation = useQuery({
    queryKey: ["order-confirmation", orderId],
    queryFn: () => {
      if (!orderId) throw new Error("Λείπει ο αριθμός αναφοράς παραγγελίας.");
      return getOrderConfirmation({ data: { orderId } });
    },
    enabled: Boolean(orderId),
    retry: false,
  });

  const isPaid = confirmation.data?.payment_status === "paid";

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
          <p className="mt-3 text-muted-foreground">
            Η πληρωμή ολοκληρώθηκε και η παραγγελία καταχωρίστηκε επιτυχώς.
          </p>
          <p className="mt-4 font-medium">Αριθμός παραγγελίας: {confirmation.data?.order_number}</p>
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
            {orderId ? "Η πληρωμή δεν έχει επιβεβαιωθεί" : "Δεν βρέθηκε παραγγελία"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {orderId && confirmation.data
              ? "Η παραγγελία υπάρχει, αλλά η πληρωμή δεν έχει επιβεβαιωθεί ακόμη. Δεν θεωρείται ολοκληρωμένη."
              : "Η σελίδα αυτή εμφανίζει επιβεβαίωση μόνο για παραγγελία που έχει καταχωριστεί και πληρωμή που έχει επιβεβαιωθεί."}
          </p>
        </>
      )}
      <Button asChild variant="outline" className="mt-8">
        <Link to="/">Επιστροφή στο κατάστημα</Link>
      </Button>
    </div>
  );
}
