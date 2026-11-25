import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { CheckCircle2, Phone } from "lucide-react";

import logo from "@/assets/logo-pilinimorfi.png";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { contactSchema, submitContactMessage, type ContactInput } from "@/lib/contact";
import { contactQuery } from "@/lib/queries";
import { ReviewModal } from "@/components/ReviewModal";
import { CookieBanner } from "@/components/CookieBanner";
import { useCookieConsent, hasCookieConsent } from "@/lib/consent";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Επικοινωνία — Πήλινη Μορφή" },
      {
        name: "description",
        content:
          "Στείλτε μας την παραγγελία ή την ερώτησή σας μέσω της φόρμας επικοινωνίας του εργαστηρίου Πήλινη Μορφή.",
      },
      { property: "og:title", content: "Επικοινωνία — Πήλινη Μορφή" },
      { property: "og:description", content: "Φόρμα επικοινωνίας για παραγγελίες και ερωτήσεις." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(contactQuery),
  component: ContactPage,
});

type FieldErrors = Partial<Record<keyof ContactInput, string | undefined>>;
type ConsentErrors = { acceptPrivacy?: string; acceptTerms?: string };

const CONTACT_DRAFT_KEY = "pilinimorfi_contact_draft";

function loadContactDraft(): Partial<ContactInput> | null {
  if (!hasCookieConsent()) {
    clearContactDraft();
    return null;
  }
  try {
    const raw = sessionStorage.getItem(CONTACT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Partial<ContactInput>;
    return null;
  } catch {
    return null;
  }
}

function saveContactDraft(draft: Partial<ContactInput>) {
  if (!hasCookieConsent()) return;
  try {
    sessionStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage may be unavailable or quota-exceeded; ignore silently.
  }
}

function clearContactDraft() {
  try {
    sessionStorage.removeItem(CONTACT_DRAFT_KEY);
  } catch {
    // ignore
  }
}

function ContactPage() {
  const { data: contact } = useSuspenseQuery(contactQuery);
  const savedDraft = loadContactDraft();
  const [values, setValues] = useState<ContactInput>(() => ({
    name: "",
    phone: "",
    message: "",
    ...savedDraft,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [consentErrors, setConsentErrors] = useState<ConsentErrors>({});
  const [hasConsent, updateConsent] = useCookieConsent();
  const [modalDismissed, setModalDismissed] = useState(false);

  const declineSessionStorage = () => {
    setModalDismissed(true);
    clearContactDraft();
  };

  const closeSessionStorageModal = () => {
    setModalDismissed(true);
    clearContactDraft();
  };

  useEffect(() => {
    if (hasConsent) {
      saveContactDraft(values);
    }
  }, [values, hasConsent]);

  const set =
    (field: keyof ContactInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const nextConsentErrors: ConsentErrors = {};
    if (!acceptPrivacy) {
      nextConsentErrors.acceptPrivacy = "Πρέπει να αποδεχθείτε την Πολιτική Απορρήτου.";
    }
    if (!acceptTerms) nextConsentErrors.acceptTerms = "Πρέπει να αποδεχθείτε τους Όρους Χρήσης.";
    setConsentErrors(nextConsentErrors);
    if (Object.keys(nextConsentErrors).length) return;
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ContactInput;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await submitContactMessage({ data: parsed.data });
      setSent(true);
      clearContactDraft();
      setReviewModalOpen(true);
    } catch {
      setSent(true);
      clearContactDraft();
      setReviewModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl px-5 py-16 md:py-24">
      <h1 className="font-display text-4xl md:text-5xl">Επικοινωνία</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Για παραγγελίες και ερωτήσεις, συμπληρώστε τη φόρμα και θα σας απαντήσουμε το συντομότερο
        δυνατό. Αν προτιμάτε, καλέστε μας απευθείας στο{" "}
        <a
          href={contact.phoneHref}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {contact.phone}
        </a>
        .
      </p>

      {sent ? (
        <div className="mt-10 rounded-md border border-primary/25 bg-secondary px-6 py-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
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
            <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium">
              Όνομα
            </label>
            <input
              id="contact-name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={set("name")}
              aria-invalid={!!errors.name}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-medium">
              Τηλέφωνο
            </label>
            <input
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              maxLength={10}
              value={values.phone}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                setValues((v) => ({ ...v, phone: value }));
                setErrors((err) => ({ ...err, phone: undefined }));
              }}
              aria-invalid={!!errors.phone}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
          </div>
          <div>
            <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium">
              Μήνυμα
            </label>
            <textarea
              id="contact-message"
              rows={6}
              value={values.message}
              onChange={set("message")}
              aria-invalid={!!errors.message}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.message && <p className="mt-1 text-sm text-destructive">{errors.message}</p>}
          </div>
          <div className="space-y-3 rounded-md border border-border p-4">
            <p className="text-sm font-medium">Όροι αποστολής</p>
            <div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="contact-accept-terms"
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
                  aria-invalid={!!consentErrors.acceptTerms}
                  aria-describedby={
                    consentErrors.acceptTerms ? "contact-accept-terms-error" : undefined
                  }
                  className="mt-0.5"
                />
                <label htmlFor="contact-accept-terms" className="text-sm leading-relaxed">
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
                  id="contact-accept-terms-error"
                  role="alert"
                  className="mt-1 text-sm text-destructive"
                >
                  {consentErrors.acceptTerms}
                </p>
              )}
            </div>
            <div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="contact-accept-privacy"
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
                  aria-invalid={!!consentErrors.acceptPrivacy}
                  aria-describedby={
                    consentErrors.acceptPrivacy ? "contact-accept-privacy-error" : undefined
                  }
                  className="mt-0.5"
                />
                <label htmlFor="contact-accept-privacy" className="text-sm leading-relaxed">
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
                  id="contact-accept-privacy-error"
                  role="alert"
                  className="mt-1 text-sm text-destructive"
                >
                  {consentErrors.acceptPrivacy}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">* Υποχρεωτικά πεδία</p>
          </div>
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Αποστολή…" : "Αποστολή μηνύματος"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Με την αποστολή αποδέχεστε την{" "}
            <Link to="/privacy" className="underline underline-offset-4">
              Πολιτική Απορρήτου
            </Link>
            . Τα στοιχεία σας χρησιμοποιούνται μόνο για να σας απαντήσουμε.
          </p>
        </form>
      )}

      <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
        <Phone className="h-4 w-4 text-primary" />
        Τηλεφωνικά:{" "}
        <a
          href={contact.phoneHref}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {contact.phone}
        </a>
      </p>
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
                Τα στοιχεία της φόρμας επικοινωνίας αποθηκεύονται προσωρινά στη μνήμη συνεδρίας του
                περιηγητή σας, προκειμένου να μην χάνονται σε περίπτωση ανανέωσης ή κλεισίματος της
                καρτέλας.
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
