import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, ChevronRight, PackageCheck, PackageOpen } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  createBoxNowLockerEmail,
  createBoxNowReadyEmail,
  createCourierDispatchEmail,
  createPurchaseConfirmationEmail,
} from "@/lib/order-email-templates";
import { getSimulatedOrderJourney } from "@/lib/orders";
import { formatPrice } from "@/lib/shopify";

const searchSchema = z.object({ orderId: z.string().uuid().optional() });

export const Route = createFileRoute("/mock-order-journey")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Προσομοίωση παραγγελίας και αποστολής — Πήλινη Μορφή" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MockOrderJourneyPage,
});

function MockOrderJourneyPage() {
  const { orderId } = Route.useSearch();
  const [activeNotification, setActiveNotification] = useState(0);
  const query = useQuery({
    queryKey: ["mock-order-journey", orderId],
    queryFn: () => {
      if (!orderId) throw new Error("Δεν βρέθηκε δοκιμαστική παραγγελία.");
      return getSimulatedOrderJourney({ data: { orderId } });
    },
    enabled: import.meta.env.DEV && Boolean(orderId),
    retry: false,
  });

  if (!import.meta.env.DEV) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <PackageOpen className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-5 font-display text-3xl">Η προσομοίωση δεν είναι διαθέσιμη</h1>
      </div>
    );
  }

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center" role="status">
        Φόρτωση της δοκιμαστικής παραγγελίας...
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl">Δεν ήταν δυνατή η φόρτωση της προσομοίωσης</h1>
        <p role="alert" className="mt-3 text-destructive">
          {query.error?.message ?? "Δεν βρέθηκαν στοιχεία παραγγελίας."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Επιστροφή στο κατάστημα</Link>
        </Button>
      </div>
    );
  }

  const order = query.data;
  const orderNumber = order.order_number;
  const totalAmount = formatPrice(String(order.total_amount), order.currency);
  const orderItems = order.items.map((item) => ({
    title: item.title,
    quantity: item.quantity,
    unitPrice: formatPrice(String(item.unit_price), order.currency),
  }));
  const locker = {
    name: order.boxnow_locker_name,
    id: order.boxnow_locker_id,
    addressLine: order.boxnow_locker_address,
    postalCode: order.boxnow_locker_postal_code,
  };
  const simulatedTrackingCode = `BN-SIM-${orderNumber}`;

  const notifications =
    order.shipping_method === "boxnow"
      ? [
          {
            step: "Επιβεβαίωση παραγγελίας",
            channel: "Email καταστήματος",
            email: createPurchaseConfirmationEmail({
              customerName: order.customer_name,
              orderNumber,
              items: orderItems,
              totalAmount,
            }),
          },
          {
            step: "Επιλογή θυρίδας BoxNow",
            channel: "Email καταστήματος · χωρίς προσφώνηση ονόματος",
            email: createBoxNowLockerEmail({ orderNumber, locker }),
          },
          {
            step: "Αποστολή και κωδικός tracking",
            channel: "Email καταστήματος",
            email: createCourierDispatchEmail({
              customerName: order.customer_name,
              orderNumber,
              courierName: "BoxNow",
              trackingCode: simulatedTrackingCode,
            }),
          },
          {
            step: "Το δέμα έφτασε στη θυρίδα",
            channel: "Ειδοποίηση BoxNow · προεπισκόπηση",
            email: createBoxNowReadyEmail({ orderNumber, locker }),
          },
        ]
      : [
          {
            step: "Επιβεβαίωση παραγγελίας",
            channel: "Email καταστήματος",
            email: createPurchaseConfirmationEmail({
              customerName: order.customer_name,
              orderNumber,
              items: orderItems,
              totalAmount,
            }),
          },
          {
            step: "Αποστολή και κωδικός tracking",
            channel: "Email καταστήματος · courier",
            email: createCourierDispatchEmail({
              customerName: order.customer_name,
              orderNumber,
              courierName: "Courier (δοκιμή)",
              trackingCode: `COURIER-SIM-${orderNumber}`,
            }),
          },
        ];

  const selectedNotification = notifications[activeNotification];

  if (!selectedNotification) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl">Δεν βρέθηκε το στάδιο ειδοποίησης</h1>
        <p role="alert" className="mt-3 text-muted-foreground">
          Ανανεώστε τη σελίδα για να φορτωθούν ξανά τα στάδια της παραγγελίας.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Επιστροφή στο κατάστημα</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:py-16">
      <div className="rounded-lg border border-amber-500/40 bg-secondary p-4 text-sm">
        <p className="font-semibold">Προσομοίωση εμπειρίας πελάτη — δεν αποστέλλονται email</p>
        <p className="mt-1 text-muted-foreground">
          Δεν γίνεται πραγματική χρέωση, δεν δημιουργείται αποστολή στη BoxNow και ο κωδικός
          tracking είναι εικονικός.
        </p>
      </div>

      <header className="mt-8">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Παραγγελία #{orderNumber}
        </p>
        <h1 className="mt-2 font-display text-4xl">Η διαδρομή της παραγγελίας</h1>
        <p className="mt-3 text-muted-foreground">
          Προεπισκόπηση των email και ειδοποιήσεων από την επιβεβαίωση μέχρι την παράδοση στη
          θυρίδα.
        </p>
      </header>

      <section className="mt-8 rounded-lg border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display text-xl">Σύνοψη δοκιμής</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Πελάτης</dt>
            <dd className="font-medium">{order.customer_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email παραλήπτη</dt>
            <dd className="font-medium">{order.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Τρόπος αποστολής</dt>
            <dd className="font-medium">
              {order.shipping_method === "boxnow" ? "BoxNow Locker" : "Courier (δοκιμή)"}
            </dd>
          </div>
          {order.shipping_method === "boxnow" && (
            <div>
              <dt className="text-muted-foreground">Επιλεγμένη θυρίδα</dt>
              <dd className="font-medium">
                {locker.name} · {locker.id}
                {locker.addressLine && ` · ${locker.addressLine}`}
                {locker.postalCode && ` · ${locker.postalCode}`}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Σύνολο</dt>
            <dd className="font-medium">{totalAmount}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Στάδια και ειδοποιήσεις</h2>
        <ol className="mt-4 space-y-3">
          {notifications.map((notification, index) => (
            <li key={notification.step}>
              <button
                type="button"
                aria-current={index === activeNotification ? "step" : undefined}
                onClick={() => setActiveNotification(index)}
                className={`flex w-full items-center gap-3 rounded-md border p-4 text-left transition-colors ${
                  index === activeNotification
                    ? "border-primary bg-secondary"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                {index < activeNotification ? (
                  <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <PackageCheck
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                <span>
                  <span className="block font-medium">{notification.step}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {notification.channel}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-live="polite"
        className="mt-6 rounded-lg border border-border bg-card p-5 shadow-soft md:p-7"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Προεπισκόπηση μηνύματος · {activeNotification + 1}/{notifications.length}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{selectedNotification.channel}</p>
        <h3 className="mt-4 font-display text-2xl">{selectedNotification.email.subject}</h3>
        <pre className="mt-5 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
          {selectedNotification.email.text}
        </pre>
        <div className="mt-6 flex justify-between gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="outline"
            disabled={activeNotification === 0}
            onClick={() => setActiveNotification((step) => Math.max(0, step - 1))}
          >
            <ChevronLeft className="mr-1 size-4" />
            Προηγούμενο
          </Button>
          <Button
            type="button"
            disabled={activeNotification === notifications.length - 1}
            onClick={() =>
              setActiveNotification((step) => Math.min(notifications.length - 1, step + 1))
            }
          >
            Επόμενο
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </section>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Η BoxNow θα στείλει τον πραγματικό κωδικό ανοίγματος και την προθεσμία παραλαβής απευθείας
        στον πελάτη, αφού ενεργοποιηθεί η επίσημη διασύνδεση.
      </p>
      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link to="/">Επιστροφή στο κατάστημα</Link>
        </Button>
      </div>
    </div>
  );
}
