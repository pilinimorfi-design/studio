import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { specialOrdersQuery } from "@/lib/queries";
import {
  specialOrderSchema,
  submitSpecialOrderInquiry,
  type SpecialOrderInput,
} from "@/lib/special-orders";
import { ReviewModal } from "@/components/ReviewModal";

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

type FieldErrors = Partial<Record<keyof SpecialOrderInput, string | undefined>>;
type ConsentErrors = { acceptPrivacy?: string; acceptTerms?: string };

function SpecialOrdersPage() {
  const { data: content } = useSuspenseQuery(specialOrdersQuery);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [consentErrors, setConsentErrors] = useState<ConsentErrors>({});

  function setTextField(field: Exclude<keyof SpecialOrderInput, "quantity">, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    const nextConsentErrors: ConsentErrors = {};
    if (!acceptPrivacy) {
      nextConsentErrors.acceptPrivacy = "Πρέπει να αποδεχθείτε την Πολιτική Απορρήτου.";
    }
    if (!acceptTerms) nextConsentErrors.acceptTerms = "Πρέπει να αποδεχθείτε τους Όρους Χρήσης.";
    setConsentErrors(nextConsentErrors);
    if (Object.keys(nextConsentErrors).length) return;
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
      setReviewModalOpen(true);
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
          <div className="space-y-3 rounded-md border border-border p-4">
            <p className="text-sm font-medium">Όροι αποστολής</p>
            <div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="special-order-accept-privacy"
                  name="acceptPrivacy"
                  required
                  checked={acceptPrivacy}
                  onCheckedChange={(checked) => {
                    setAcceptPrivacy(checked === true);
                    setConsentErrors((current) => {
                      const { acceptPrivacy: _omitPrivacy, ...rest } = current;
                      return rest;
                    });
                  }}
                  aria-invalid={Boolean(consentErrors.acceptPrivacy)}
                  aria-describedby={
                    consentErrors.acceptPrivacy ? "special-order-accept-privacy-error" : undefined
                  }
                  className="mt-0.5"
                />
                <label htmlFor="special-order-accept-privacy" className="text-sm leading-relaxed">
                  Διάβασα και αποδέχομαι την{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Πολιτική Απορρήτου
                  </Link>
                  . <span className="text-destructive">*</span>
                </label>
              </div>
              {consentErrors.acceptPrivacy && (
                <p
                  id="special-order-accept-privacy-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {consentErrors.acceptPrivacy}
                </p>
              )}
            </div>
            <div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="special-order-accept-terms"
                  name="acceptTerms"
                  required
                  checked={acceptTerms}
                  onCheckedChange={(checked) => {
                    setAcceptTerms(checked === true);
                    setConsentErrors((current) => {
                      const { acceptTerms: _omitTerms, ...rest } = current;
                      return rest;
                    });
                  }}
                  aria-invalid={Boolean(consentErrors.acceptTerms)}
                  aria-describedby={
                    consentErrors.acceptTerms ? "special-order-accept-terms-error" : undefined
                  }
                  className="mt-0.5"
                />
                <label htmlFor="special-order-accept-terms" className="text-sm leading-relaxed">
                  Διάβασα και αποδέχομαι τους{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Όρους Χρήσης
                  </Link>
                  . <span className="text-destructive">*</span>
                </label>
              </div>
              {consentErrors.acceptTerms && (
                <p
                  id="special-order-accept-terms-error"
                  className="mt-1 text-sm text-destructive"
                  role="alert"
                >
                  {consentErrors.acceptTerms}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">* Υποχρεωτικά πεδία</p>
          </div>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Αποστολή…" : "Αποστολή αιτήματος"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Τα στοιχεία σας θα χρησιμοποιηθούν μόνο για την απάντηση στο αίτημά σας.
          </p>
        </form>
      )}
      <ReviewModal open={reviewModalOpen} onOpenChange={setReviewModalOpen} />
    </section>
  );
}
