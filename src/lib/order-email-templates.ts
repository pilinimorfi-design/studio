export type OrderEmailItem = {
  title: string;
  quantity: number;
  unitPrice: string;
};

export type OrderEmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

type PurchaseConfirmationInput = {
  customerName: string;
  orderNumber: string | number;
  items: OrderEmailItem[];
  totalAmount: string;
};

type BoxNowLockerInput = {
  orderNumber: string | number;
  locker: {
    name: string;
    id: string;
    addressLine: string | null;
    postalCode: string | null;
  };
};

type CourierDispatchInput = {
  customerName: string;
  orderNumber: string | number;
  courierName: string;
  trackingCode: string;
  trackingUrl?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmail(subject: string, lines: string[]): OrderEmailTemplate {
  const text = lines.join("\n\n");
  const html = [
    '<!doctype html><html lang="el"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#35271f">',
    ...lines.map((line) => `<p>${escapeHtml(line).replace(/\n/g, "<br>")}</p>`),
    "</body></html>",
  ].join("");

  return { subject, text, html };
}

function renderItems(items: OrderEmailItem[]) {
  return items.map((item) => `${item.title} × ${item.quantity} — ${item.unitPrice}`).join("\n");
}

export function createPurchaseConfirmationEmail({
  customerName,
  orderNumber,
  items,
  totalAmount,
}: PurchaseConfirmationInput): OrderEmailTemplate {
  const itemLines = renderItems(items);
  return renderEmail(`Επιβεβαίωση αγοράς — παραγγελία #${orderNumber}`, [
    `Γεια σας ${customerName},`,
    `Σας ευχαριστούμε για την αγορά σας από την Πήλινη Μορφή. Η παραγγελία #${orderNumber} καταχωρίστηκε επιτυχώς.`,
    "Σύνοψη παραγγελίας:",
    itemLines || "Δεν υπάρχουν διαθέσιμα στοιχεία προϊόντων.",
    `Σύνολο: ${totalAmount}`,
    "Θα λάβετε ξεχωριστό email με τα στοιχεία παρακολούθησης μόλις ετοιμαστεί και αποσταλεί το δέμα σας.",
    "Με εκτίμηση,\nΠήλινη Μορφή",
  ]);
}

export function createBoxNowLockerEmail({
  orderNumber,
  locker,
}: BoxNowLockerInput): OrderEmailTemplate {
  const lockerDetails = [
    `Θυρίδα: ${locker.name}`,
    `Κωδικός θυρίδας: ${locker.id}`,
    ...(locker.addressLine ? [`Διεύθυνση: ${locker.addressLine}`] : []),
    ...(locker.postalCode ? [`Ταχυδρομικός κώδικας: ${locker.postalCode}`] : []),
  ].join("\n");

  return renderEmail(`Στοιχεία BoxNow — παραγγελία #${orderNumber}`, [
    `Η παραγγελία #${orderNumber} θα παραδοθεί στη θυρίδα BoxNow που επιλέξατε.`,
    lockerDetails,
    "Θα ενημερωθείτε από τη BoxNow όταν το δέμα είναι διαθέσιμο για παραλαβή.",
    "Με εκτίμηση,\nΠήλινη Μορφή",
  ]);
}

export function createBoxNowReadyEmail({
  orderNumber,
  locker,
}: BoxNowLockerInput): OrderEmailTemplate {
  const lockerDetails = [
    `Θυρίδα: ${locker.name}`,
    `Κωδικός θυρίδας: ${locker.id}`,
    ...(locker.addressLine ? [`Διεύθυνση: ${locker.addressLine}`] : []),
    ...(locker.postalCode ? [`Ταχυδρομικός κώδικας: ${locker.postalCode}`] : []),
  ].join("\n");

  return renderEmail(`Το δέμα σας είναι έτοιμο για παραλαβή — #${orderNumber}`, [
    `Η παραγγελία #${orderNumber} είναι έτοιμη για παραλαβή από τη θυρίδα BoxNow.`,
    lockerDetails,
    "Για τον κωδικό ανοίγματος και την προθεσμία παραλαβής, ακολουθήστε την επίσημη ειδοποίηση της BoxNow. Το παρόν είναι προεπισκόπηση δοκιμής και δεν περιλαμβάνει πραγματικό κωδικό παραλαβής.",
    "Με εκτίμηση,\nΠήλινη Μορφή",
  ]);
}

export function createCourierDispatchEmail({
  customerName,
  orderNumber,
  courierName,
  trackingCode,
  trackingUrl,
}: CourierDispatchInput): OrderEmailTemplate {
  const lines = [
    `Γεια σας ${customerName},`,
    `Η παραγγελία #${orderNumber} έχει αποσταλεί με ${courierName}.`,
    `Τελικός κωδικός αποστολής: ${trackingCode}`,
  ];

  if (trackingUrl) {
    try {
      const url = new URL(trackingUrl);
      if (url.protocol === "https:") lines.push(`Παρακολούθηση αποστολής: ${url.toString()}`);
    } catch {
      // Ignore malformed optional tracking links and retain the tracking code.
    }
  }

  lines.push("Με εκτίμηση,\nΠήλινη Μορφή");
  return renderEmail(`Η παραγγελία #${orderNumber} στάλθηκε`, lines);
}
