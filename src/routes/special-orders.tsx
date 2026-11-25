import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";

import logo from "@/assets/logo-pilinimorfi.png";
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
import { CookieBanner } from "@/components/CookieBanner";
import { useCookieConsent, hasCookieConsent } from "@/lib/consent";

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

const SPECIAL_ORDER_DRAFT_KEY = "pilinimorfi_special_order_draft";

function loadSpecialOrderDraft(): Partial<SpecialOrderInput> | null {
  if (!hasCookieConsent()) {
    clearSpecialOrderDraft();
    return null;
  }
  try {
    const raw = sessionStorage.getItem(SPECIAL_ORDER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Partial<SpecialOrderInput>;
    return null;
  } catch {
    return null;
  }
}

function saveSpecialOrderDraft(draft: Partial<SpecialOrderInput>) {
  if (!hasCookieConsent()) return;
  try {
    sessionStorage.setItem(SPECIAL_ORDER_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage may be unavailable or quota-exceeded; ignore silently.
  }
}

function clearSpecialOrderDraft() {
  try {
    sessionStorage.removeItem(SPECIAL_ORDER_DRAFT_KEY);
  } catch {
    // ignore
  }
}

const initialValues: SpecialOrderInput = {
  fullName: "",
  phone: "",
  email: "",
  quantity: 20,
  technicalDetails: "",
  deliveryWindowUnit: "Ημέρες",
  deliveryWindowFrom: 15,
  deliveryWindowTo: 30,
  deliveryWindow: "",
};

type FieldErrors = Partial<Record<keyof SpecialOrderInput, string | undefined>>;
type ConsentErrors = { acceptPrivacy?: string; acceptTerms?: string };

function SpecialOrdersPage() {
  const { data: content } = useSuspenseQuery(specialOrdersQuery);
  const savedDraft = loadSpecialOrderDraft();
  const [values, setValues] = useState<SpecialOrderInput>(() => ({
    ...initialValues,
    ...savedDraft,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [consentErrors, setConsentErrors] = useState<ConsentErrors>({});
  const [hasConsent, updateConsent] = useCookieConsent();
  const [modalDismissed, setModalDismissed] = useState(false);

  const declineSessionStorage = () => {
    setModalDismissed(true);
    clearSpecialOrderDraft();
  };

  const closeSessionStorageModal = () => {
    setModalDismissed(true);
    clearSpecialOrderDraft();
  };

  useEffect(() => {
    if (hasConsent) {
      saveSpecialOrderDraft(values);
    }
  }, [values, hasConsent]);

  function setTextField(field: Exclude<keyof SpecialOrderInput, "quantity">, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function setDeliveryWindowUnit(unit: "Ημέρες" | "Εβδομάδες") {
    const defaultFrom = unit === "Ημέρες" ? 15 : 2;
    const defaultTo = unit === "Ημέρες" ? 30 : 4;
    setValues((current) => ({
      ...current,
      deliveryWindowUnit: unit,
      deliveryWindowFrom: defaultFrom,
      deliveryWindowTo: defaultTo,
      deliveryWindow: `Από ${defaultFrom} έως ${defaultTo} ${unit}`,
    }));
    setErrors((current) => ({
      ...current,
      deliveryWindowUnit: undefined,
      deliveryWindowFrom: undefined,
      deliveryWindowTo: undefined,
      deliveryWindow: undefined,
    }));
  }

  function setDeliveryWindowFrom(value: string) {
    const num = value === "" ? undefined : Number(value);
    setValues((current) => {
      const from = num;
      const to = current.deliveryWindowTo;
      return {
        ...current,
        deliveryWindowFrom: from,
        deliveryWindow:
          from != null && to != null
            ? `Από ${from} έως ${to} ${current.deliveryWindowUnit}`
            : current.deliveryWindow,
      };
    });
    setErrors((current) => ({
      ...current,
      deliveryWindowFrom: undefined,
      deliveryWindow: undefined,
    }));
  }

  function setDeliveryWindowTo(value: string) {
    const num = value === "" ? undefined : Number(value);
    setValues((current) => {
      const from = current.deliveryWindowFrom;
      const to = num;
      return {
        ...current,
        deliveryWindowTo: to,
        deliveryWindow:
          from != null && to != null
            ? `Από ${from} έως ${to} ${current.deliveryWindowUnit}`
            : current.deliveryWindow,
      };
    });
    setErrors((current) => ({
      ...current,
      deliveryWindowTo: undefined,
      deliveryWindow: undefined,
    }));
  }

  function validateDeliveryWindow() {
    const result = specialOrderSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path;
        if (Array.isArray(path) && path.length === 1 && typeof path[0] === "string") {
          nextErrors[path[0] as keyof SpecialOrderInput] = issue.message;
        }
      }
      setErrors(nextErrors);
    } else {
      setErrors((current) => {
        const {
          deliveryWindowUnit: _,
          deliveryWindowFrom: __,
          deliveryWindowTo: ___,
          deliveryWindow: ____,
          ...rest
        } = current;
        return rest;
      });
    }
  }

  function validateField(field: keyof SpecialOrderInput, value: unknown) {
    const result = specialOrderSchema.safeParse({ ...values, [field]: value });
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => Array.isArray(i.path) && i.path.length === 1 && i.path[0] === field,
      );
      setErrors((current) => ({ ...current, [field]: issue?.message ?? undefined }));
    } else {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
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
      clearSpecialOrderDraft();
      setReviewModalOpen(true);
    } catch {
      setSent(true);
      clearSpecialOrderDraft();
      setReviewModalOpen(true);
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
          <p className="mt-4 font-medium">
            Ευχαριστούμε! Λάβαμε το μήνυμά σας και θα επικοινωνήσουμε μαζί σας το συντομότερο
            δυνατό.
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
                validateField("fullName", values.fullName);
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
              className="w-full"
              value={values.phone}
              onChange={(event) => setTextField("phone", event.target.value)}
              onBlur={() => {
                validateField("phone", values.phone);
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
                validateField("email", values.email);
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
                validateField("quantity", values.quantity);
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
                validateField("technicalDetails", values.technicalDetails);
              }}
              aria-invalid={Boolean(errors.technicalDetails)}
            />
            {fieldError("technicalDetails")}
          </div>
          <div>
            <label htmlFor="special-order-delivery" className="mb-1.5 block text-sm font-medium">
              Χρονικό περιθώριο παράδοσης
            </label>
            <div className="flex items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Μονάδα</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="delivery-window-unit"
                      value="Ημέρες"
                      checked={values.deliveryWindowUnit === "Ημέρες"}
                      onChange={() => setDeliveryWindowUnit("Ημέρες")}
                      className="form-radio"
                    />
                    Ημέρες
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="delivery-window-unit"
                      value="Εβδομάδες"
                      checked={values.deliveryWindowUnit === "Εβδομάδες"}
                      onChange={() => setDeliveryWindowUnit("Εβδομάδες")}
                      className="form-radio"
                    />
                    Εβδομάδες
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 w-[14ch]">
                <label className="text-sm font-medium">Από</label>
                <Input
                  id="special-order-delivery-from"
                  type="number"
                  min="1"
                  required
                  value={values.deliveryWindowFrom ?? ""}
                  onChange={(event) => setDeliveryWindowFrom(event.target.value)}
                  onBlur={validateDeliveryWindow}
                  aria-invalid={Boolean(errors.deliveryWindowFrom)}
                />
                {errors.deliveryWindowFrom && (
                  <p className="mt-1 text-sm text-destructive">{errors.deliveryWindowFrom}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 w-[14ch]">
                <label className="text-sm font-medium">Έως</label>
                <Input
                  id="special-order-delivery-to"
                  type="number"
                  min="1"
                  required
                  value={values.deliveryWindowTo ?? ""}
                  onChange={(event) => setDeliveryWindowTo(event.target.value)}
                  onBlur={validateDeliveryWindow}
                  aria-invalid={Boolean(errors.deliveryWindowTo)}
                />
                {errors.deliveryWindowTo && (
                  <p className="mt-1 text-sm text-destructive">{errors.deliveryWindowTo}</p>
                )}
              </div>
            </div>
            {errors.deliveryWindow && (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {errors.deliveryWindow}
              </p>
            )}
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
      {!hasConsent && !modalDismissed && (
        <CookieBanner
          open
          onClose={closeSessionStorageModal}
          showCookiePolicyLink={true}
          linkHref="/cookies?from=modal"
          message={
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <img
                  src={logo}
                  alt=""
                  aria-hidden="true"
                  className="size-10 object-contain sm:size-12"
                />
                <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                  Πήλινη Μορφή
                </span>
              </div>
              <p className="leading-relaxed text-center">
                Τα στοιχεία της φόρμας ειδικής παραγγελίας αποθηκεύονται προσωρινά στη μνήμη
                συνεδρίας του περιηγητή σας, προκειμένου να μην χάνονται σε περίπτωση ανανέωσης ή
                κλεισίματος της καρτέλας.
              </p>
              <p className="leading-relaxed text-muted-foreground text-xs sm:text-[13px] text-center">
                Διαγράφονται αυτόματα μετά την αποστολή ή το κλείσιμο του browser.
              </p>
            </div>
          }
          primaryLabel="Αποδοχή προσωρινής αποθήκευσης"
          primaryVariant="default"
          primaryOnClick={() => updateConsent(true)}
          secondaryLabel="Συνέχεια χωρίς αποθήκευση"
          secondaryVariant="outline"
          secondaryOnClick={declineSessionStorage}
        />
      )}
    </section>
  );
}
