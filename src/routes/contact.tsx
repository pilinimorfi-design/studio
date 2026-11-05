import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contactSchema, submitContactMessage, type ContactInput } from "@/lib/contact";
import { contactQuery } from "@/lib/queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Επικοινωνία — Πήλινη Μορφή" },
      {
        name: "description",
        content: "Στείλτε μας την παραγγελία ή την ερώτησή σας μέσω της φόρμας επικοινωνίας του εργαστηρίου Πήλινη Μορφή.",
      },
      { property: "og:title", content: "Επικοινωνία — Πήλινη Μορφή" },
      { property: "og:description", content: "Φόρμα επικοινωνίας για παραγγελίες και ερωτήσεις." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(contactQuery),
  component: ContactPage,
});

type FieldErrors = Partial<Record<keyof ContactInput, string>>;

function ContactPage() {
  const { data: contact } = useSuspenseQuery(contactQuery);
  const [values, setValues] = useState<ContactInput>({ name: "", phone: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (field: keyof ContactInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
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
    } catch {
      setSubmitError("Η αποστολή απέτυχε. Δοκιμάστε ξανά ή καλέστε μας τηλεφωνικά.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl px-5 py-16 md:py-24">
      <h1 className="font-display text-4xl md:text-5xl">Επικοινωνία</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Για παραγγελίες και ερωτήσεις, συμπληρώστε τη φόρμα και θα σας απαντήσουμε τηλεφωνικά. Αν προτιμάτε, καλέστε
        μας απευθείας
        {contact && (
          <>
            {" "}
            στο{" "}
            <a href={contact.phoneHref} className="font-medium text-foreground underline underline-offset-4">
              {contact.phone}
            </a>
          </>
        )}
        .
      </p>

      {sent ? (
        <div className="mt-10 rounded-md border border-primary/25 bg-secondary px-6 py-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-4 font-medium">Το μήνυμά σας εστάλη.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Θα επικοινωνήσουμε μαζί σας στο τηλέφωνο που μας δώσατε.
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
              value={values.phone}
              onChange={set("phone")}
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

      {contact && (
        <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 text-primary" />
          Τηλεφωνικά:{" "}
          <a href={contact.phoneHref} className="font-medium text-foreground underline underline-offset-4">
            {contact.phone}
          </a>
        </p>
      )}
    </section>
  );
}
