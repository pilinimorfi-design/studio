import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { specialOrdersQuery } from "@/lib/queries";
import {
  specialOrderSchema,
  submitSpecialOrderInquiry,
  type SpecialOrderInput,
} from "@/lib/special-orders";

export const Route = createFileRoute("/special-orders")({
  head: () => ({
    meta: [
      { title: "Ειδικές Παραγγελίες Χονδρικής — Πήλινη Μορφή" },
      {
        name: "description",
        content:
          "Δεχόμαστε παραγγελίες χονδρικής για χειροποίητα κεραμικά. Στείλτε μας τις ανάγκες και τις τεχνικές λεπτομέρειες.",
      },
      { property: "og:title", content: "Ειδικές Παραγγελίες — Πήλινη Μορφή" },
      {
        property: "og:description",
        content: "Επικοινωνήστε μαζί μας για παραγγελίες χονδρικής και ειδικές κατασκευές.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(specialOrdersQuery),
  component: SpecialOrdersPage,
});

const initialValues: SpecialOrderInput = {
  fullName: "",
  phone: "",
  email: "",
  quantity: 20,
  technicalDetails: "",
  deliveryWindow: "",
};

type FieldErrors = Partial<Record<keyof SpecialOrderInput, string>>;

function SpecialOrdersPage() {
  const { data: content } = useSuspenseQuery(specialOrdersQuery);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function setTextField(field: Exclude<keyof SpecialOrderInput, "quantity">, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    const parsed = specialOrderSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field as keyof SpecialOrderInput]) {
          fieldErrors[field as keyof SpecialOrderInput] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await submitSpecialOrderInquiry({ data: parsed.data });
      setSent(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Δεν ήταν δυνατή η αποστολή του αιτήματος. Δοκιμάστε ξανά.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(field: keyof SpecialOrderInput) {
    return errors[field] ? (
      <p className="mt-1 text-sm text-destructive" role="alert">
        {errors[field]}
      </p>
    ) : null;
  }

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 md:py-24">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
        {content.eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Ειδικές Παραγγελίες</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">{content.description}</p>

      {sent ? (
        <div className="mt-10 rounded-md border border-primary/25 bg-secondary px-6 py-8 text-center">
          <CheckCircle2 className="mx-auto size-8 text-primary" />
          <p className="mt-4 font-medium">Το αίτημά σας εστάλη.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Θα επικοινωνήσουμε μαζί σας για τις λεπτομέρειες της παραγγελίας.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Επιστροφή στην αρχική</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-10 flex flex-col gap-5">
          <div>
            <label htmlFor="special-order-name" className="mb-1.5 block text-sm font-medium">
              Ονοματεπώνυμο
            </label>
            <Input
              id="special-order-name"
              autoComplete="name"
              required
              value={values.fullName}
              onChange={(event) => setTextField("fullName", event.target.value)}
              onBlur={() => {
                const result = specialOrderSchema.shape.fullName.safeParse(values.fullName);
                setErrors((current) => ({
                  ...current,
                  fullName: result.success ? undefined : result.error.issues[0]?.message,
                }));
              }}
              aria-invalid={Boolean(errors.fullName)}
            />
            {fieldError("fullName")}
          </div>
          <div>
            <label htmlFor="special-order-phone" className="mb-1.5 block text-sm font-medium">
              Τηλέφωνο
            </label>
            <Input
              id="special-order-phone"
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              required
              placeholder="10 ψηφία"
              className="w-[12ch]"
              value={values.phone}
              onChange={(event) => setTextField("phone", event.target.value)}
              onBlur={() => {
                const result = specialOrderSchema.shape.phone.safeParse(values.phone);
                setErrors((current) => ({
                  ...current,
                  phone: result.success ? undefined : result.error.issues[0]?.message,
                }));
              }}
              aria-invalid={Boolean(errors.phone)}
            />
            {fieldError("phone")}
          </div>
          <div>
            <label htmlFor="special-order-email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <Input
              id="special-order-email"
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={(event) => setTextField("email", event.target.value)}
              onBlur={() => {
                const result = specialOrderSchema.shape.email.safeParse(values.email);
                setErrors((current) => ({
                  ...current,
                  email: result.success ? undefined : result.error.issues[0]?.message,
                }));
              }}
              aria-invalid={Boolean(errors.email)}
            />
            {fieldError("email")}
          </div>
          <div>
            <label htmlFor="special-order-quantity" className="mb-1.5 block text-sm font-medium">
              Ποσότητα (τεμάχια)
            </label>
            <Input
              id="special-order-quantity"
              type="number"
              min="20"
              max="999999"
              step="1"
              required
              className="w-[12ch]"
              value={values.quantity}
              onChange={(event) => {
                const quantity = Number(event.target.value);
                setValues((current) => ({ ...current, quantity }));
                setErrors((current) => ({ ...current, quantity: undefined }));
              }}
              onBlur={() => {
                const result = specialOrderSchema.shape.quantity.safeParse(values.quantity);
                setErrors((current) => ({
                  ...current,
                  quantity: result.success ? undefined : result.error.issues[0]?.message,
                }));
              }}
              aria-invalid={Boolean(errors.quantity)}
            />
            {fieldError("quantity")}
          </div>
          <div>
            <label htmlFor="special-order-details" className="mb-1.5 block text-sm font-medium">
              Τεχνικές λεπτομέρειες
            </label>
            <Textarea
              id="special-order-details"
              rows={5}
              required
              placeholder={content.detailsPlaceholder}
              value={values.technicalDetails}
              onChange={(event) => setTextField("technicalDetails", event.target.value)}
              onBlur={() => {
                const result = specialOrderSchema.shape.technicalDetails.safeParse(
                  values.technicalDetails,
                );
                setErrors((current) => ({
                  ...current,
                  technicalDetails: result.success ? undefined : result.error.issues[0]?.message,
                }));
              }}
              aria-invalid={Boolean(errors.technicalDetails)}
            />
            {fieldError("technicalDetails")}
          </div>
          <div>
            <label htmlFor="special-order-delivery" className="mb-1.5 block text-sm font-medium">
              Χρονικό περιθώριο παράδοσης
            </label>
            <Input
              id="special-order-delivery"
              required
              placeholder={content.deliveryPlaceholder}
              value={values.deliveryWindow}
              onChange={(event) => setTextField("deliveryWindow", event.target.value)}
              onBlur={() => {
                const result = specialOrderSchema.shape.deliveryWindow.safeParse(
                  values.deliveryWindow,
                );
                setErrors((current) => ({
                  ...current,
                  deliveryWindow: result.success ? undefined : result.error.issues[0]?.message,
                }));
              }}
              aria-invalid={Boolean(errors.deliveryWindow)}
            />
            {fieldError("deliveryWindow")}
          </div>
          {submitError && (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          )}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Αποστολή…" : "Αποστολή αιτήματος"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Με την αποστολή αποδέχεστε την{" "}
            <Link to="/privacy" className="underline underline-offset-4">
              Πολιτική Απορρήτου
            </Link>
            . Τα στοιχεία θα χρησιμοποιηθούν μόνο για την απάντηση στο αίτημά σας.
          </p>
        </form>
      )}
    </section>
  );
}
