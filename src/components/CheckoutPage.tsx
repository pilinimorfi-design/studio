import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, Info, Package, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import logo from "@/assets/logo-pilinimorfi.png";
import { BoxNowLockerPicker } from "@/components/BoxNowLockerPicker";
import { CookieBanner } from "@/components/CookieBanner";
import type { BoxNowLocker } from "@/lib/boxnow";
import { useCookieConsent } from "@/lib/consent";
import { createSimulatedOrder } from "@/lib/orders";
import { lookupGreekPostalCode } from "@/lib/postal-code";
import {
  ACS_PRICE_PER_PARCEL,
  BOXNOW_PACKAGES,
  FREE_SHIPPING_THRESHOLD,
  packBoxNowItems,
} from "@/lib/shipping";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";

type PaymentMethod = "everypay" | "cod";
type ShippingMethod = "boxnow" | "acs";
type CheckoutField =
  | "customerName"
  | "email"
  | "phone"
  | "shippingAddress"
  | "postalCode"
  | "city"
  | "village"
  | "county"
  | "shippingNotes"
  | "locker";
type CheckoutFieldErrors = Partial<Record<CheckoutField, string | undefined>>;
type LegalConsentField = "acceptPrivacy" | "acceptTerms";
type LegalConsentErrors = Partial<Record<LegalConsentField, string>>;

type CheckoutDraft = {
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  shippingNotes: string;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  postalCode: string;
  city: string;
  village: string;
  county: string;
  selectedLockers: Record<number, BoxNowLocker>;
};

const CHECKOUT_DRAFT_KEY = "pilinimorfi_checkout_draft";

function loadDraft(): Partial<CheckoutDraft> | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Partial<CheckoutDraft>;
    return null;
  } catch {
    return null;
  }
}

function saveDraft(draft: Partial<CheckoutDraft>) {
  try {
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage may be unavailable or quota-exceeded; ignore silently.
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const cartToken = useCartStore((state) => state.cartToken);
  const draft = loadDraft();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    draft?.paymentMethod ?? "everypay",
  );
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(
    draft?.shippingMethod ?? "boxnow",
  );
  const [selectedLockers, setSelectedLockers] = useState<Record<number, BoxNowLocker>>(
    draft?.selectedLockers ?? {},
  );
  const [postalCode, setPostalCode] = useState(draft?.postalCode ?? "");
  const [city, setCity] = useState(draft?.city ?? "");
  const [village, setVillage] = useState(draft?.village ?? "");
  const [county, setCounty] = useState(draft?.county ?? "");
  const [postalCodeStatus, setPostalCodeStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [consentErrors, setConsentErrors] = useState<LegalConsentErrors>({});
  const [customerName, setCustomerName] = useState(draft?.customerName ?? "");
  const [email, setEmail] = useState(draft?.email ?? "");
  const [phone, setPhone] = useState(draft?.phone ?? "");
  const [shippingAddress, setShippingAddress] = useState(draft?.shippingAddress ?? "");
  const [shippingNotes, setShippingNotes] = useState(draft?.shippingNotes ?? "");
  const simulationEnabled = import.meta.env.DEV;
  const navigate = useNavigate();

  const [hasConsent, updateConsent] = useCookieConsent();

  const acceptCookies = () => {
    updateConsent(true);
  };

  const goBack = () => {
    try {
      sessionStorage.setItem("open_cart_drawer", "true");
    } catch {
      // ignore
    }
    navigate({ to: "/" });
  };

  useEffect(() => {
    saveDraft({
      customerName,
      email,
      phone,
      shippingAddress,
      shippingNotes,
      shippingMethod,
      paymentMethod,
      postalCode,
      city,
      village,
      county,
      selectedLockers,
    });
  }, [
    customerName,
    email,
    phone,
    shippingAddress,
    shippingNotes,
    shippingMethod,
    paymentMethod,
    postalCode,
    city,
    village,
    county,
    selectedLockers,
  ]);
  const cityWasEdited = useRef(false);
  const countyWasEdited = useRef(false);
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price.amount) * item.quantity,
    0,
  );
  const boxNowPacking = useMemo(
    () =>
      packBoxNowItems(
        items.map(({ product, quantity }) => ({
          productId: product.id,
          title: product.title,
          quantity,
          heightCm: product.heightCm,
          lengthCm: product.lengthCm,
          widthCm: product.widthCm,
        })),
      ),
    [items],
  );
  const boxNowShipping = boxNowPacking.packages.reduce((total, parcel) => total + parcel.price, 0);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const boxNowShippingCharged = isFreeShipping ? 0 : boxNowShipping;
  const shippingAmount =
    shippingMethod === "boxnow"
      ? boxNowShippingCharged
      : items.length > 0
        ? ACS_PRICE_PER_PARCEL
        : 0;
  const orderTotal = subtotal + shippingAmount;
  const boxNowPackageKey = JSON.stringify(
    boxNowPacking.packages.map((parcel) => [
      parcel.size,
      parcel.items.map(({ productId, quantity }) => [productId, quantity]),
    ]),
  );
  const activeBoxNowPackage = boxNowPacking.packages.findIndex(
    (_, index) => !selectedLockers[index],
  );

  function getFieldError(
    field: CheckoutField,
    value: string,
    municipality = city,
    villageName = village,
  ) {
    const trimmed = value.trim();
    switch (field) {
      case "customerName":
        return trimmed.length < 2 || trimmed.length > 150 ? "Γράψτε το ονοματεπώνυμό σας." : "";
      case "email":
        return trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
          ? "Γράψτε ένα έγκυρο email."
          : "";
      case "phone":
        return /^\d{10}$/.test(trimmed) ? "" : "Το τηλέφωνο πρέπει να έχει 10 ψηφία.";
      case "shippingAddress":
        return trimmed.length < 3 || trimmed.length > 300 ? "Γράψτε Διεύθυνση" : "";
      case "postalCode":
        return /^\d{5}$/.test(trimmed) ? "" : "Γράψτε έγκυρο ΤΚ";
      case "city":
        if (trimmed.length < 2 || trimmed.length > 150) {
          return "Συμπληρώστε τον Δήμο";
        }
        return municipality.trim().length + villageName.trim().length + 3 > 150
          ? "Ο Δήμος και η Πόλη πρέπει να έχουν έως 150 χαρακτήρες συνολικά."
          : "";
      case "village":
        if (trimmed.length < 2 || trimmed.length > 150) {
          return "Συμπληρώστε την Πόλη";
        }
        return municipality.trim().length + trimmed.length + 3 > 150
          ? "Ο Δήμος και η Πόλη πρέπει να έχουν έως 150 χαρακτήρες συνολικά."
          : "";
      case "county":
        return trimmed.length > 150 ? "Ο Νομός πρέπει να έχει έως 150 χαρακτήρες." : "";
      case "shippingNotes":
        return trimmed.length > 1000 ? "Τα σχόλια πρέπει να έχουν έως 1000 χαρακτήρες." : "";
      case "locker":
        return trimmed ? "" : "Επιλέξτε πρώτα θυρίδα BoxNow.";
    }
    return "";
  }

  function validateField(field: CheckoutField, value: string) {
    setFieldErrors((current) => ({
      ...current,
      [field]:
        getFieldError(
          field,
          value,
          field === "city" ? value : city,
          field === "village" ? value : village,
        ) || undefined,
    }));
  }

  function updateFieldError(field: CheckoutField, value: string) {
    if (!fieldErrors[field]) return;
    setFieldErrors((current) => {
      const municipality = field === "city" ? value : city;
      const villageName = field === "village" ? value : village;
      const next = {
        ...current,
        [field]: getFieldError(field, value, municipality, villageName) || undefined,
      };
      if (field === "city" || (fieldErrors.city && field === "village")) {
        next.city = getFieldError("city", municipality, municipality, villageName) || undefined;
      }
      if (field === "village" || (fieldErrors.village && field === "city")) {
        next.village =
          getFieldError("village", villageName, municipality, villageName) || undefined;
      }
      return next;
    });
  }

  function validateConsents(privacy: boolean, terms: boolean) {
    const next: LegalConsentErrors = {};
    if (!privacy) next.acceptPrivacy = "Πρέπει να αποδεχθείτε την Πολιτική Απορρήτου.";
    if (!terms) next.acceptTerms = "Πρέπει να αποδεχθείτε τους Όρους Χρήσης.";
    setConsentErrors(next);
    return next;
  }

  function renderFieldError(field: CheckoutField) {
    const message = fieldErrors[field];
    return message ? (
      <p id={`checkout-${field}-error`} role="alert" className="mt-1.5 text-sm text-destructive">
        {message}
      </p>
    ) : null;
  }

  function getCheckoutErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.toLocaleLowerCase("el").includes("απόθεμα")) {
      return "Το απόθεμα άλλαξε. Ενημερώστε το καλάθι και δοκιμάστε ξανά.";
    }
    return "Δεν ήταν δυνατή η δημιουργία της παραγγελίας. Ελέγξτε τα στοιχεία και δοκιμάστε ξανά.";
  }

  function getServerValidationErrors(error: unknown): CheckoutFieldErrors | null {
    if (!(error instanceof Error)) return null;
    try {
      const details: unknown = JSON.parse(error.message);
      if (!Array.isArray(details)) return null;
      const fieldMap: Record<string, CheckoutField> = {
        customerName: "customerName",
        email: "email",
        phone: "phone",
        shippingAddress: "shippingAddress",
        shippingPostalCode: "postalCode",
        shippingCity: "city",
        shippingCounty: "county",
        shippingNotes: "shippingNotes",
      };
      const messages: Partial<Record<CheckoutField, string>> = {
        customerName: "Γράψτε το ονοματεπώνυμό σας.",
        email: "Γράψτε ένα έγκυρο email.",
        phone: "Το τηλέφωνο πρέπει να έχει 10 ψηφία.",
        shippingAddress: "Γράψτε Διεύθυνση",
        postalCode: "Γράψτε έγκυρο ΤΚ",
        city: "Συμπληρώστε τον Δήμο και την Πόλη.",
        county: "Ελέγξτε τον Νομό.",
        shippingNotes: "Ελέγξτε τα σχόλια παράδοσης.",
      };
      const errors: CheckoutFieldErrors = {};
      for (const issue of details) {
        if (typeof issue !== "object" || issue === null || !("path" in issue)) continue;
        const path = issue.path;
        if (!Array.isArray(path)) continue;
        const sourceField = path.find((part): part is string => typeof part === "string");
        const field = sourceField ? fieldMap[sourceField] : undefined;
        if (field && messages[field]) errors[field] = messages[field];
      }
      return Object.keys(errors).length ? errors : null;
    } catch {
      return null;
    }
  }

  async function submitSimulatedCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setFieldErrors({});
    const missingConsents = validateConsents(acceptPrivacy, acceptTerms);
    if (Object.keys(missingConsents).length) {
      document.getElementById("checkout-consents")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (paymentMethod !== "everypay") {
      setSubmitError("Η προσομοίωση υποστηρίζει προσωρινά μόνο πληρωμή με κάρτα.");
      return;
    }
    if (!cartToken) {
      setSubmitError("Δεν βρέθηκε το ενεργό καλάθι. Ανανεώστε τη σελίδα και δοκιμάστε ξανά.");
      return;
    }
    const municipality = city.trim();
    const villageName = village.trim();
    const shippingCity = shippingMethod === "acs" ? `${municipality} / ${villageName}` : "";
    const shippingCounty = county.trim();
    const errors: CheckoutFieldErrors = {};
    const fieldValues: Array<[CheckoutField, string]> = [
      ["customerName", customerName.trim()],
      ["email", email.trim()],
      ["phone", phone.trim()],
    ];
    if (shippingMethod === "acs") {
      fieldValues.push(
        ["shippingAddress", shippingAddress.trim()],
        ["postalCode", postalCode],
        ["city", municipality],
        ["village", villageName],
        ["county", shippingCounty],
      );
    } else if (activeBoxNowPackage >= 0) {
      errors.locker = getFieldError("locker", "");
    }
    fieldValues.push(["shippingNotes", shippingNotes.trim()]);
    for (const [field, value] of fieldValues) {
      const message = getFieldError(field, value, municipality, villageName);
      if (message) errors[field] = message;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      const fieldIds: Partial<Record<CheckoutField, string>> = {
        customerName: "checkout-name",
        email: "checkout-email",
        phone: "checkout-phone",
        shippingAddress: "checkout-address",
        postalCode: "checkout-postal-code",
        city: "checkout-city",
        village: "checkout-village",
        county: "checkout-county",
        shippingNotes: "checkout-delivery-notes",
      };
      const invalidField = Object.keys(errors)[0] as CheckoutField | undefined;
      if (invalidField === "locker") {
        document.getElementById("checkout-locker-picker")?.scrollIntoView({ behavior: "smooth" });
      } else {
        const fieldId = invalidField ? fieldIds[invalidField] : undefined;
        if (fieldId) document.getElementById(fieldId)?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const checkout = await createSimulatedOrder({
        data: {
          cartToken,
          customerName: customerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          shippingMethod,
          lockerId: selectedLockers[0]?.id ?? "",
          lockerName: selectedLockers[0]?.name ?? "",
          lockerAddressLine: selectedLockers[0]?.addressLine ?? "",
          lockerPostalCode: selectedLockers[0]?.postalCode ?? "",
          shippingPackages:
            shippingMethod === "boxnow"
              ? boxNowPacking.packages.map((parcel, index) => ({
                  size: parcel.size,
                  volumeCm3: parcel.volumeCm3,
                  items: parcel.items.map(({ productId, quantity }) => ({ productId, quantity })),
                  locker: selectedLockers[index]
                    ? {
                        id: selectedLockers[index].id,
                        name: selectedLockers[index].name,
                        addressLine: selectedLockers[index].addressLine ?? "",
                        postalCode: selectedLockers[index].postalCode ?? "",
                      }
                    : null,
                }))
              : [
                  {
                    size: "acs" as const,
                    volumeCm3: null,
                    items: items.map(({ product, quantity }) => ({
                      productId: product.id,
                      quantity,
                    })),
                    locker: null,
                  },
                ],
          shippingAddress: shippingAddress.trim(),
          shippingPostalCode: postalCode,
          shippingCity,
          shippingCounty,
          shippingNotes: shippingNotes.trim(),
        },
      });
      saveDraft({
        customerName,
        email,
        phone,
        shippingAddress,
        shippingNotes,
        shippingMethod,
        paymentMethod,
        postalCode,
        city,
        village,
        county,
        selectedLockers,
      });
      window.location.assign(checkout.paymentUrl);
    } catch (error) {
      const serverErrors = getServerValidationErrors(error);
      if (serverErrors) setFieldErrors(serverErrors);
      else setSubmitError(getCheckoutErrorMessage(error));
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
      setPostalCodeStatus("Αναζητείται Δήμος/Πόλη και Νομός…");
      try {
        const address = await lookupGreekPostalCode({ data: postalCode });
        if (!active) return;
        if (!address) {
          setPostalCodeStatus(
            "Δεν βρέθηκε αντιστοιχία. Συμπληρώστε Δήμο/Πόλη, Χωριό και Νομό χειροκίνητα.",
          );
          return;
        }

        const cityFilled = Boolean(address.city && !cityWasEdited.current);
        const countyFilled = Boolean(address.county && !countyWasEdited.current);
        if (cityFilled) setCity(address.city ?? "");
        if (countyFilled) setCounty(address.county ?? "");

        if (cityFilled && countyFilled) {
          setPostalCodeStatus(
            "Ο Δήμος/Πόλη και ο Νομός συμπληρώθηκαν αυτόματα. Συμπληρώστε το Χωριό.",
          );
        } else if (cityFilled || countyFilled) {
          setPostalCodeStatus(
            `Συμπληρώθηκε αυτόματα ${cityFilled ? "ο Δήμος/Πόλη" : "ο Νομός"}. Ελέγξτε και συμπληρώστε τα υπόλοιπα πεδία, μαζί με το Χωριό.`,
          );
        } else {
          setPostalCodeStatus("Ελέγξτε και, αν χρειάζεται, συμπληρώστε Δήμο/Πόλη, Χωριό και Νομό.");
        }
      } catch {
        if (active) {
          setPostalCodeStatus(
            "Η αυτόματη αναζήτηση δεν ήταν διαθέσιμη. Συμπληρώστε Δήμο/Πόλη, Χωριό και Νομό χειροκίνητα.",
          );
        }
      }
    }, 400);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [postalCode, shippingMethod]);

  useEffect(() => {
    if (boxNowPacking.error && shippingMethod === "boxnow") setShippingMethod("acs");
  }, [boxNowPacking.error, shippingMethod]);

  useEffect(() => {
    setSelectedLockers({});
  }, [boxNowPackageKey]);

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
    <>
      <div className="" style={{ minHeight: "100vh" }}>
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
                <strong>Λειτουργία δοκιμής:</strong> η παραγγελία αποθηκεύεται ως δοκιμαστική και
                οδηγεί σε εικονικό περιβάλλον πληρωμής. Δεν γίνεται χρέωση και δεν δημιουργείται
                πραγματική αποστολή.
              </p>
            ) : (
              <p>
                Η ολοκλήρωση παραγγελίας και η πληρωμή δεν είναι διαθέσιμες σε αυτό το περιβάλλον.
                Δεν θα γίνει χρέωση ή αποστολή από αυτή τη σελίδα.
              </p>
            )}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <section className="rounded-lg border border-border bg-card p-6 shadow-soft md:p-8">
              <h2 className="font-display text-2xl">Στοιχεία επισκέπτη</h2>
              <form
                className="mt-6 space-y-7"
                noValidate
                onSubmit={(event) => void submitSimulatedCheckout(event)}
              >
                <p className="mt-2 text-xs text-muted-foreground">
                  Τα στοιχεία που συμπληρώνετε αποθηκεύονται προσωρινά στην μνήμη συνεδρίας του
                  περιηγητή μόνο για να είναι εύκολη η επανάληψη στην περίπτωση αποτυχίας πληρωμής.
                  Διαγράφονται αυτόματα μόλις ολοκληρωθεί επιτυχώς η πληρωμή ή κλείσετε την καρτέλα.
                </p>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="checkout-name" className="mb-1.5 block text-sm font-medium">
                      Ονοματεπώνυμο
                    </label>
                    <Input
                      id="checkout-name"
                      name="customerName"
                      autoComplete="name"
                      required
                      value={customerName}
                      aria-invalid={Boolean(fieldErrors.customerName)}
                      aria-describedby={
                        fieldErrors.customerName ? "checkout-customerName-error" : undefined
                      }
                      onBlur={(event) => validateField("customerName", event.target.value)}
                      onChange={(event) => {
                        setCustomerName(event.target.value);
                        updateFieldError("customerName", event.target.value);
                      }}
                    />
                    {renderFieldError("customerName")}
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
                      value={email}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "checkout-email-error" : undefined}
                      onBlur={(event) => validateField("email", event.target.value)}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        updateFieldError("email", event.target.value);
                      }}
                    />
                    {renderFieldError("email")}
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
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={phone}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? "checkout-phone-error" : undefined}
                      onBlur={(event) => validateField("phone", event.target.value)}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(value);
                        updateFieldError("phone", value);
                      }}
                    />
                    {renderFieldError("phone")}
                  </div>
                </div>

                <fieldset>
                  <legend className="font-display text-xl">Τρόπος αποστολής</legend>
                  <RadioGroup
                    value={shippingMethod}
                    onValueChange={(value) => {
                      if (value === "boxnow" || value === "acs") {
                        if (value === "boxnow" && boxNowPacking.error) return;
                        setShippingMethod(value);
                        setFieldErrors((current) => ({ ...current, locker: undefined }));
                      }
                    }}
                    className="mt-3"
                    aria-label="Τρόπος αποστολής"
                  >
                    <label
                      htmlFor="shipping-boxnow"
                      className={`flex items-start gap-3 rounded-md border border-border p-4 ${
                        boxNowPacking.error ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                      }`}
                    >
                      <RadioGroupItem
                        id="shipping-boxnow"
                        value="boxnow"
                        className="mt-1"
                        disabled={Boolean(boxNowPacking.error)}
                      />
                      <span>
                        <span className="block font-medium">BoxNow Locker</span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {boxNowPacking.error
                            ? boxNowPacking.error
                            : `${boxNowPacking.packages.length} ${
                                boxNowPacking.packages.length === 1 ? "δέμα" : "δέματα"
                              } — ${
                                isFreeShipping
                                  ? "Δωρεάν"
                                  : formatPrice(boxNowShipping.toString(), "EUR") +
                                    ". Η χρέωση περιλαμβάνει συσκευασία."
                              }`}
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
                          Παράδοση στη διεύθυνσή σας — προσωρινά{" "}
                          {formatPrice(ACS_PRICE_PER_PARCEL.toString(), "EUR")} ανά δέμα,
                          συμπεριλαμβανομένης της συσκευασίας.
                        </span>
                      </span>
                    </label>
                  </RadioGroup>
                </fieldset>

                {shippingMethod === "boxnow" && !boxNowPacking.error ? (
                  <div className="mt-4 p-3 rounded-lg border border-border bg-muted/50">
                    {isFreeShipping ? (
                      <p className="text-sm font-medium text-foreground">
                        Κερδίσατε δωρεάν μεταφορικά με BoxNow!
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-foreground">
                        Προσθέστε προϊόντα αξίας{" "}
                        {formatPrice((FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2), "EUR")} ακόμα
                        για δωρεάν μεταφορικά με BoxNow!
                      </p>
                    )}
                  </div>
                ) : null}

                {shippingMethod === "acs" ? (
                  <fieldset className="space-y-5">
                    <legend className="font-display text-xl">Διεύθυνση παράδοσης</legend>
                    {boxNowPacking.error && (
                      <div className="mt-2 p-3 rounded-lg border border-border bg-muted/50">
                        <p className="text-sm font-medium text-foreground">
                          Η αποστολή γίνεται αποκλειστικά με Courier λόγω των διαστάσεων του
                          προϊόντος.
                        </p>
                      </div>
                    )}
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
                        className="sm:max-w-[calc(50%-0.625rem)]"
                        value={postalCode}
                        aria-invalid={Boolean(fieldErrors.postalCode)}
                        aria-describedby={
                          fieldErrors.postalCode ? "checkout-postalCode-error" : undefined
                        }
                        onBlur={(event) => validateField("postalCode", event.target.value)}
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, "").slice(0, 5);
                          setPostalCode(value);
                          updateFieldError("postalCode", value);
                          setCity("");
                          setVillage("");
                          setCounty("");
                          setFieldErrors((current) => ({
                            ...current,
                            postalCode: current.postalCode
                              ? getFieldError("postalCode", value) || undefined
                              : undefined,
                            city: undefined,
                            village: undefined,
                            county: undefined,
                          }));
                          cityWasEdited.current = false;
                          countyWasEdited.current = false;
                        }}
                      />
                      {renderFieldError("postalCode")}
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
                      <label htmlFor="checkout-county" className="mb-1.5 block text-sm font-medium">
                        Νομός
                      </label>
                      <Input
                        id="checkout-county"
                        autoComplete="address-level1"
                        value={county}
                        aria-invalid={Boolean(fieldErrors.county)}
                        aria-describedby={fieldErrors.county ? "checkout-county-error" : undefined}
                        onBlur={(event) => validateField("county", event.target.value)}
                        onChange={(event) => {
                          countyWasEdited.current = true;
                          setCounty(event.target.value);
                          updateFieldError("county", event.target.value);
                        }}
                      />
                      {renderFieldError("county")}
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="checkout-city" className="mb-1.5 block text-sm font-medium">
                          Δήμος
                        </label>
                        <Input
                          id="checkout-city"
                          autoComplete="address-level2"
                          required
                          value={city}
                          aria-invalid={Boolean(fieldErrors.city)}
                          aria-describedby={fieldErrors.city ? "checkout-city-error" : undefined}
                          onBlur={(event) => validateField("city", event.target.value)}
                          onChange={(event) => {
                            cityWasEdited.current = true;
                            setCity(event.target.value);
                            updateFieldError("city", event.target.value);
                          }}
                        />
                        {renderFieldError("city")}
                      </div>
                      <div>
                        <label
                          htmlFor="checkout-village"
                          className="mb-1.5 block text-sm font-medium"
                        >
                          Πόλη
                        </label>
                        <Input
                          id="checkout-village"
                          autoComplete="address-level3"
                          placeholder="π.χ. Μπολάτι"
                          required
                          value={village}
                          aria-invalid={Boolean(fieldErrors.village)}
                          aria-describedby={
                            fieldErrors.village ? "checkout-village-error" : undefined
                          }
                          onBlur={(event) => validateField("village", event.target.value)}
                          onChange={(event) => {
                            setVillage(event.target.value);
                            updateFieldError("village", event.target.value);
                          }}
                        />
                        {renderFieldError("village")}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-address"
                        className="mb-1.5 block text-sm font-medium"
                      >
                        Οδός και αριθμός
                      </label>
                      <Input
                        id="checkout-address"
                        name="shippingAddress"
                        autoComplete="street-address"
                        required
                        value={shippingAddress}
                        aria-invalid={Boolean(fieldErrors.shippingAddress)}
                        aria-describedby={
                          fieldErrors.shippingAddress ? "checkout-shippingAddress-error" : undefined
                        }
                        onBlur={(event) => validateField("shippingAddress", event.target.value)}
                        onChange={(event) => {
                          setShippingAddress(event.target.value);
                          updateFieldError("shippingAddress", event.target.value);
                        }}
                      />
                      {renderFieldError("shippingAddress")}
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
                        value={shippingNotes}
                        aria-invalid={Boolean(fieldErrors.shippingNotes)}
                        aria-describedby={
                          fieldErrors.shippingNotes ? "checkout-shippingNotes-error" : undefined
                        }
                        onBlur={(event) => validateField("shippingNotes", event.target.value)}
                        onChange={(event) => {
                          setShippingNotes(event.target.value);
                          updateFieldError("shippingNotes", event.target.value);
                        }}
                      />
                      {renderFieldError("shippingNotes")}
                    </div>
                  </fieldset>
                ) : (
                  <fieldset className="min-w-0 space-y-4 rounded-md border border-border bg-muted/40 p-4">
                    <legend className="px-2 font-display text-xl">Δέματα και lockers BoxNow</legend>
                    <p className="text-sm text-muted-foreground">
                      Ο όγκος των συσκευασμένων προϊόντων χωρίζει αυτόματα την παραγγελία σε δέματα.
                      Επιλέξτε ξεχωριστό locker για κάθε δέμα.
                    </p>
                    {boxNowPacking.packages.map((parcel, index) => {
                      const parcelSize = BOXNOW_PACKAGES.find((size) => size.size === parcel.size)!;
                      const locker = selectedLockers[index];
                      return (
                        <div key={index} className="rounded-md border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">
                                Δέμα {index + 1} — {parcelSize.label} ({parcelSize.heightCm} ×{" "}
                                {parcelSize.lengthCm} × {parcelSize.widthCm} cm)
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Όγκος {parcel.volumeCm3.toLocaleString("el-GR")} cm³ ·{" "}
                                {formatPrice(parcel.price.toString(), "EUR")}
                              </p>
                            </div>
                            {locker && (
                              <p className="text-right text-sm">
                                {locker.name}
                                {locker.addressLine && ` — ${locker.addressLine}`}
                                {locker.postalCode && `, ${locker.postalCode}`}
                              </p>
                            )}
                          </div>
                          <ul className="mt-2 text-sm text-muted-foreground">
                            {parcel.items.map((item) => (
                              <li key={item.productId}>
                                {item.title} × {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    {activeBoxNowPackage >= 0 && (
                      <div id="checkout-locker-picker">
                        <p className="mb-3 text-sm font-medium">
                          Επιλέξτε locker για το δέμα {activeBoxNowPackage + 1}.
                        </p>
                        <BoxNowLockerPicker
                          onSelect={(locker) => {
                            setSelectedLockers((current) => ({
                              ...current,
                              [activeBoxNowPackage]: locker,
                            }));
                            setFieldErrors((current) => ({ ...current, locker: undefined }));
                          }}
                        />
                      </div>
                    )}
                    {renderFieldError("locker")}
                  </fieldset>
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

                <fieldset id="checkout-consents" className="space-y-3" aria-label="Όροι αγοράς">
                  <legend className="sr-only">Όροι αγοράς</legend>
                  <div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="checkout-accept-terms"
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
                          consentErrors.acceptTerms ? "checkout-accept-terms-error" : undefined
                        }
                        className="mt-0.5"
                      />
                      <label htmlFor="checkout-accept-terms" className="text-sm leading-relaxed">
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
                        id="checkout-accept-terms-error"
                        role="alert"
                        className="mt-1.5 text-sm text-destructive"
                      >
                        {consentErrors.acceptTerms}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="checkout-accept-privacy"
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
                          consentErrors.acceptPrivacy ? "checkout-accept-privacy-error" : undefined
                        }
                        className="mt-0.5"
                      />
                      <label htmlFor="checkout-accept-privacy" className="text-sm leading-relaxed">
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
                        id="checkout-accept-privacy-error"
                        role="alert"
                        className="mt-1.5 text-sm text-destructive"
                      >
                        {consentErrors.acceptPrivacy}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">* Υποχρεωτικά πεδία</p>
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
                  <li key={product.id} className="flex items-start justify-between gap-4 p-4">
                    <div className="shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-14 h-14 rounded-lg object-cover border border-border/50 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-border flex items-center justify-center border border-border/50 shrink-0">
                          <Package className="size-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
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
                {shippingMethod === "boxnow" ? (
                  boxNowPacking.packages.map((parcel, index) => {
                    const parcelSize = BOXNOW_PACKAGES.find((size) => size.size === parcel.size)!;
                    return (
                      <li key={index} className="flex justify-between gap-4 p-4 text-sm">
                        <span>
                          Μεταφορικά BoxNow — δέμα {index + 1} ({parcelSize.label})
                        </span>
                        <span>
                          {isFreeShipping
                            ? "Δωρεάν (0,00 €)"
                            : formatPrice(parcel.price.toString(), "EUR")}
                        </span>
                      </li>
                    );
                  })
                ) : (
                  <li className="flex justify-between gap-4 p-4 text-sm">
                    <span>Μεταφορικά ACS — 1 δέμα (περιλαμβάνεται η συσκευασία)</span>
                    <span>{formatPrice(ACS_PRICE_PER_PARCEL.toString(), "EUR")}</span>
                  </li>
                )}
                <li className="flex justify-between border-t border-border p-4 font-semibold">
                  <span>Σύνολο</span>
                  <span>{formatPrice(orderTotal.toString(), "EUR")}</span>
                </li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Οι χρεώσεις αποστολής περιλαμβάνουν έξοδα συσκευασίας. Η χρέωση ACS είναι προσωρινή
                σταθερή τιμή ανά δέμα.
              </p>
            </section>
          </div>
        </div>
      </div>
      {!hasConsent && (
        <CookieBanner
          open
          onClose={goBack}
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
                Για να προχωρήσετε στο ταμείο και να ολοκληρώσετε την αγορά σας, απαιτείται η
                αποδοχή της Πολιτικής Cookies για τη λειτουργία του καλαθιού και την επεξεργασία των
                στοιχείων αποστολής.
              </p>
            </div>
          }
          primaryLabel="Αποδοχή και συνέχεια"
          primaryVariant="default"
          primaryOnClick={acceptCookies}
          secondaryLabel="Επιστροφή στο καλάθι"
          secondaryVariant="outline"
          secondaryOnClick={goBack}
        />
      )}
    </>
  );
}
