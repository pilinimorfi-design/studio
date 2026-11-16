import { describe, expect, it } from "vitest";

import {
  createBoxNowLockerEmail,
  createCourierDispatchEmail,
  createPurchaseConfirmationEmail,
} from "@/lib/order-email-templates";

describe("order email templates", () => {
  it("confirms the purchase and says tracking details will follow later", () => {
    const email = createPurchaseConfirmationEmail({
      customerName: "Μαρία",
      orderNumber: 1042,
      items: [{ title: "Κεραμικό μπολ", quantity: 2, unitPrice: "25,00 €" }],
      totalAmount: "50,00 €",
    });

    expect(email.subject).toContain("1042");
    expect(email.text).toContain("Γεια σας Μαρία");
    expect(email.text).toContain("Κεραμικό μπολ × 2");
    expect(email.text).toContain("Σύνολο: 50,00 €");
    expect(email.text).toContain("ξεχωριστό email με τα στοιχεία παρακολούθησης");
    expect(email.html).toContain("Κεραμικό μπολ");
  });

  it("provides BoxNow locker details without including a customer name", () => {
    const email = createBoxNowLockerEmail({
      orderNumber: 1042,
      locker: {
        name: "Σύνταγμα",
        id: "BN-123",
        addressLine: "Πλατεία Συντάγματος 1",
        postalCode: "10563",
      },
    });

    expect(email.subject).toContain("BoxNow");
    expect(email.text).toContain("Θυρίδα: Σύνταγμα");
    expect(email.text).toContain("Κωδικός θυρίδας: BN-123");
    expect(email.text).toContain("Διεύθυνση: Πλατεία Συντάγματος 1");
    expect(email.text).not.toContain("Γεια σας");
    expect(email.html).not.toContain("Γεια σας");
  });

  it("sends the courier message with the customer name and final tracking code", () => {
    const email = createCourierDispatchEmail({
      customerName: "Μαρία",
      orderNumber: 1042,
      courierName: "ACS Courier",
      trackingCode: "ACS-987654",
      trackingUrl: "https://example.com/track/ACS-987654",
    });

    expect(email.subject).toContain("1042");
    expect(email.text).toContain("Γεια σας Μαρία");
    expect(email.text).toContain("ACS Courier");
    expect(email.text).toContain("Τελικός κωδικός αποστολής: ACS-987654");
    expect(email.html).toContain("https://example.com/track/ACS-987654");
  });

  it("escapes untrusted values in HTML", () => {
    const email = createCourierDispatchEmail({
      customerName: "<script>alert(1)</script>",
      orderNumber: 1042,
      courierName: "ACS",
      trackingCode: "<img src=x>",
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("&lt;img");
  });
});
