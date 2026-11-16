import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, Info, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { BoxNowLockerPicker } from "@/components/BoxNowLockerPicker";
import type { BoxNowLocker } from "@/lib/boxnow";
import { createSimulatedOrder } from "@/lib/orders";
import { lookupGreekPostalCode } from "@/lib/postal-code";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";

type PaymentMethod = "everypay" | "cod";
type ShippingMethod = "boxnow" | "acs";

export function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const cartToken = useCartStore((state) => state.cartToken);
  const clearLocalCart = useCartStore((state) => state.clearLocalCart);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("everypay");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("boxnow");
  const [selectedLocker, setSelectedLocker] = useState<BoxNowLocker | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [postalCodeStatus, setPostalCodeStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const simulationEnabled = import.meta.env.DEV;
  const cityWasEdited = useRef(false);
  const countyWasEdited = useRef(false);
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price.amount) * item.quantity,
    0,
  );

  async function submitSimulatedCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    if (paymentMethod !== "everypay") {
      setSubmitError("Η προσομοίωση υποστηρίζει προσωρινά μόνο πληρωμή με κάρτα.");
      return;
    }
    if (!cartToken) {
      setSubmitError("Δεν βρέθηκε το ενεργό καλάθι. Ανανεώστε τη σελίδα και δοκιμάστε ξανά.");
      return;
    }
    if (shippingMethod === "boxnow" && !selectedLocker) {
      setSubmitError("Επιλέξτε πρώτα θυρίδα BoxNow.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    try {
      const checkout = await createSimulatedOrder({
        data: {
          cartToken,
          customerName: String(formData.get("customerName") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          shippingMethod,
          lockerId: selectedLocker?.id ?? "",
          lockerName: selectedLocker?.name ?? "",
          shippingAddress: String(formData.get("shippingAddress") ?? ""),
          shippingPostalCode: postalCode,
          shippingCity: city,
          shippingCounty: county,
          shippingNotes: String(formData.get("shippingNotes") ?? ""),
        },
      });
      clearLocalCart();
      window.location.assign(checkout.paymentUrl);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Δεν ήταν δυνατή η δημιουργία δοκιμαστικής παραγγελίας.",
      );
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (shippingMethod !== "acs" || !/^\d{5}$/.test(postalCode)) {
      setPostalCodeStatus("");
      return;
    }

    let active = true;
    const timeout = window.setTimeout(async () => {
      setPostalCodeStatus("Αναζητείται Πόλη/Χωριό και Νομός…");
      try {
        const address = await lookupGreekPostalCode({ data: postalCode });
        if (!active) return;
        if (!address) {
          setPostalCodeStatus(
            "Δεν βρέθηκε αντιστοιχία. Συμπληρώστε Πόλη/Χωριό και Νομό χειροκίνητα.",
          );
          return;
        }

        const cityFilled = Boolean(address.city && !cityWasEdited.current);
        const countyFilled = Boolean(address.county && !countyWasEdited.current);
        if (cityFilled) setCity(address.city ?? "");
        if (countyFilled) setCounty(address.county ?? "");

        if (cityFilled && countyFilled) {
          setPostalCodeStatus("Η Πόλη/Χωριό και ο Νομός συμπληρώθηκαν αυτόματα.");
        } else if (cityFilled || countyFilled) {
          setPostalCodeStatus(
            `Συμπληρώθηκε αυτόματα ${cityFilled ? "η Πόλη/Χωριό" : "ο Νομός"}. Ελέγξτε και συμπληρώστε τα υπόλοιπα πεδία.`,
          );
        } else {
          setPostalCodeStatus("Ελέγξτε και, αν χρειάζεται, διορθώστε Πόλη/Χωριό και Νομό.");
        }
      } catch {
        if (active) {
          setPostalCodeStatus(
            "Η αυτόματη αναζήτηση δεν ήταν διαθέσιμη. Συμπληρώστε Πόλη/Χωριό και Νομό χειροκίνητα.",
          );
        }
      }
    }, 400);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [postalCode, shippingMethod]);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl">Το καλάθι είναι άδειο</h1>
        <Button asChild className="mt-6">
          <Link to="/">Επιστροφή στα προϊόντα</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" />
        Επιστροφή στα προϊόντα
      </Link>
      <h1 className="mt-5 font-display text-4xl">Ταμείο</h1>
      <div
        role="status"
        className="mt-3 flex max-w-3xl gap-3 rounded-md border border-primary/30 bg-secondary p-4 text-sm text-secondary-foreground"
      >
        <Info className="mt-0.5 size-4 shrink-0" />
        {simulationEnabled ? (
          <p>
            <strong>Λειτουργία δοκιμής:</strong> η παραγγελία αποθηκεύεται ως δοκιμαστική και οδηγεί
            σε εικονικό περιβάλλον πληρωμής. Δεν γίνεται χρέωση και δεν δημιουργείται πραγματική
            αποστολή.
          </p>
        ) : (
          <p>
            Η ολοκλήρωση παραγγελίας και η πληρωμή δεν είναι διαθέσιμες σε αυτό το περιβάλλον. Δεν
            θα γίνει χρέωση ή αποστολή από αυτή τη σελίδα.
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="rounded-lg border border-border bg-card p-6 shadow-soft md:p-8">
          <h2 className="font-display text-2xl">Στοιχεία επισκέπτη</h2>
          <form
            className="mt-6 space-y-7"
            onSubmit={(event) => void submitSimulatedCheckout(event)}
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="checkout-name" className="mb-1.5 block text-sm font-medium">
                  Ονοματεπώνυμο
                </label>
                <Input id="checkout-name" name="customerName" autoComplete="name" required />
              </div>
              <div>
                <label htmlFor="checkout-email" className="mb-1.5 block text-sm font-medium">
                  Email
                </label>
                <Input
                  id="checkout-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label htmlFor="checkout-phone" className="mb-1.5 block text-sm font-medium">
                  Τηλέφωνο επικοινωνίας
                </label>
                <Input
                  id="checkout-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
              </div>
            </div>

            <fieldset>
              <legend className="font-display text-xl">Τρόπος αποστολής</legend>
              <RadioGroup
                value={shippingMethod}
                onValueChange={(value) => {
                  if (value === "boxnow" || value === "acs") {
                    setShippingMethod(value);
                    if (value !== "boxnow") setSelectedLocker(null);
                  }
                }}
                className="mt-3"
                aria-label="Τρόπος αποστολής"
              >
                <label
                  htmlFor="shipping-boxnow"
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4"
                >
                  <RadioGroupItem id="shipping-boxnow" value="boxnow" className="mt-1" />
                  <span>
                    <span className="block font-medium">BoxNow Locker</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Παραλαβή από locker. Η επιλογή συγκεκριμένου locker θα προστεθεί με το επίσημο
                      widget της BoxNow.
                    </span>
                  </span>
                </label>
                <label
                  htmlFor="shipping-acs"
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4"
                >
                  <RadioGroupItem id="shipping-acs" value="acs" className="mt-1" />
                  <span>
                    <span className="block font-medium">ACS Courier</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Παράδοση στη διεύθυνσή σας. Η τιμή και η υπηρεσία αντικαταβολής χρειάζονται
                      επιβεβαίωση από την ACS.
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </fieldset>

            {shippingMethod === "acs" ? (
              <fieldset className="space-y-5">
                <legend className="font-display text-xl">Διεύθυνση παράδοσης</legend>
                <div>
                  <label htmlFor="checkout-address" className="mb-1.5 block text-sm font-medium">
                    Οδός και αριθμός
                  </label>
                  <Input
                    id="checkout-address"
                    name="shippingAddress"
                    autoComplete="street-address"
                    required
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="checkout-postal-code"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Ταχυδρομικός κώδικας
                    </label>
                    <Input
                      id="checkout-postal-code"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={5}
                      pattern="[0-9]{5}"
                      required
                      value={postalCode}
                      onChange={(event) => {
                        setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5));
                        setCity("");
                        setCounty("");
                        cityWasEdited.current = false;
                        countyWasEdited.current = false;
                      }}
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Η αναζήτηση περιοχής παρέχεται από{" "}
                      <a
                        href="https://www.openstreetmap.org/copyright"
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        OpenStreetMap
                      </a>
                      .
                    </p>
                    {postalCodeStatus && (
                      <p role="status" className="mt-1.5 text-xs text-muted-foreground">
                        {postalCodeStatus}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="checkout-city" className="mb-1.5 block text-sm font-medium">
                      Πόλη/Χωριό
                    </label>
                    <Input
                      id="checkout-city"
                      autoComplete="address-level2"
                      required
                      value={city}
                      onChange={(event) => {
                        cityWasEdited.current = true;
                        setCity(event.target.value);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="checkout-county" className="mb-1.5 block text-sm font-medium">
                    Νομός
                  </label>
                  <Input
                    id="checkout-county"
                    autoComplete="address-level1"
                    value={county}
                    onChange={(event) => {
                      countyWasEdited.current = true;
                      setCounty(event.target.value);
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="checkout-delivery-notes"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Σχόλια παράδοσης
                  </label>
                  <Textarea
                    id="checkout-delivery-notes"
                    name="shippingNotes"
                    placeholder="Πρόσθεσε σχόλια παράδοσης"
                    autoComplete="off"
                  />
                </div>
              </fieldset>
            ) : (
              <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="mb-3">Επιλέξτε το locker από τον χάρτη BoxNow.</p>
                <BoxNowLockerPicker onSelect={setSelectedLocker} />
                {selectedLocker && (
                  <p role="status" className="mt-3 text-foreground">
                    Επιλεγμένο locker: {selectedLocker.name}
                    {selectedLocker.addressLine && ` — ${selectedLocker.addressLine}`}
                    {selectedLocker.postalCode && `, ${selectedLocker.postalCode}`}
                  </p>
                )}
              </div>
            )}

            <fieldset>
              <legend className="font-display text-xl">Τρόπος πληρωμής</legend>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => {
                  if (value === "everypay" || value === "cod") setPaymentMethod(value);
                }}
                className="mt-3"
                aria-label="Τρόπος πληρωμής"
              >
                <label
                  htmlFor="payment-everypay"
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4"
                >
                  <RadioGroupItem id="payment-everypay" value="everypay" className="mt-1" />
                  <CreditCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block font-medium">Κάρτα μέσω EveryPay</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {simulationEnabled
                        ? "Δοκιμαστική ανακατεύθυνση σε εικονικό περιβάλλον. Δεν εισάγονται στοιχεία κάρτας."
                        : "Η ανακατεύθυνση πληρωμής θα ενεργοποιηθεί μετά τη διασύνδεση EveryPay."}
                    </span>
                  </span>
                </label>
                <label
                  htmlFor="payment-cod"
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4"
                >
                  <RadioGroupItem id="payment-cod" value="cod" className="mt-1" />
                  <WalletCards className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block font-medium">Αντικαταβολή</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Η διαθεσιμότητα, η χρέωση και η υποστήριξη από τον επιλεγμένο courier θα
                      επιβεβαιωθούν πριν ενεργοποιηθεί.
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </fieldset>

            {submitError && (
              <p role="alert" className="text-sm text-destructive">
                {submitError}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!simulationEnabled || isSubmitting || paymentMethod === "cod"}
            >
              {isSubmitting
                ? "Δημιουργία δοκιμαστικής παραγγελίας..."
                : simulationEnabled
                  ? paymentMethod === "cod"
                    ? "Η αντικαταβολή δεν προσομοιώνεται"
                    : "Συνέχεια σε δοκιμαστική πληρωμή"
                  : "Η ολοκλήρωση παραγγελίας δεν είναι ακόμη διαθέσιμη"}
            </Button>
          </form>
        </section>

        <section>
          <h2 className="font-display text-2xl">Η παραγγελία σας</h2>
          <ul className="mt-5 divide-y divide-border rounded-lg border border-border bg-card">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-muted-foreground">Ποσότητα: {quantity}</p>
                </div>
                <p className="font-medium">
                  {formatPrice((Number(product.price.amount) * quantity).toString(), "EUR")}
                </p>
              </li>
            ))}
            <li className="flex justify-between p-4 font-semibold">
              <span>Μερικό σύνολο</span>
              <span>{formatPrice(subtotal.toString(), "EUR")}</span>
            </li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            Τα μεταφορικά και τυχόν χρέωση αντικαταβολής δεν έχουν οριστεί. Το τελικό σύνολο θα
            εμφανίζεται πριν την ενεργοποίηση των παραγγελιών.
          </p>
        </section>
      </div>
    </div>
  );
}
