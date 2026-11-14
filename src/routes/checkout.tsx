import { createFileRoute } from "@tanstack/react-router";

import { CheckoutPage } from "@/components/CheckoutPage";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Ταμείο — Πήλινη Μορφή" },
      { name: "description", content: "Ολοκλήρωση παραγγελίας στο e-shop Πήλινη Μορφή." },
    ],
  }),
  component: CheckoutPage,
});
