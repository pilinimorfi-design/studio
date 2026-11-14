import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";

async function ordersText() {
  const terms = await siteContent.getTerms();
  return terms.sections.find((s) => s.id === "parangelies")?.paragraphs.join(" ") ?? "";
}

describe("Όροι Χρήσης — παραγγελίες, πληρωμές και αποστολές", () => {
  it("lets customers buy without creating an account", async () => {
    const text = await ordersText();

    expect(text).toContain("χωρίς να δημιουργήσετε λογαριασμό");
  });

  it("clearly says checkout ordering and payments are not active yet", async () => {
    const text = await ordersText();

    expect(text).toContain("η καταχώριση και πληρωμή παραγγελιών δεν είναι ενεργές");
    expect(text).toContain("δεν αποτελούν ολοκληρωμένη παραγγελία");
  });

  it("describes EveryPay card payment and conditional cash on delivery", async () => {
    const text = await ordersText();

    expect(text).toContain("EveryPay");
    expect(text).toContain("αντικαταβολή");
    expect(text).toContain("μόνο αν εμφανίζεται ρητά στο checkout");
    expect(text).toContain("Δεν αποθηκεύουμε τον πλήρη αριθμό της κάρτας");
  });

  it("describes both BoxNow and ACS delivery, including ACS address details", async () => {
    const text = await ordersText();

    expect(text).toContain("BoxNow");
    expect(text).toContain("ACS Courier");
    expect(text).toContain("ταχυδρομικός κώδικας, πόλη/χωριό και νομός");
    expect(text).toContain("σχόλια παράδοσης");
    expect(text).toContain("πριν από την τελική υποβολή");
  });
});
