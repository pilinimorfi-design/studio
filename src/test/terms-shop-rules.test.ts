import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";

async function termsText(id: string) {
  const terms = await siteContent.getTerms();
  return terms.sections.find((s) => s.id === id)?.paragraphs.join(" ") ?? "";
}

describe("Όροι Χρήσης — πλάσιμο, ψήσιμο και διαθεσιμότητα", () => {
  it("says the ceramics are fired outside the workshop", async () => {
    const text = await termsText("ergastirio");

    expect(text).toContain("ψήνεται εκτός του εργαστηρίου");
    expect(text).not.toContain("ψήνεται στο εργαστήριο");
  });

  it("says an unavailable product has no add-to-cart button", async () => {
    const text = await termsText("proionta");

    expect(text).toContain("δεν εμφανίζεται το κουμπί «Προσθήκη στο καλάθι»");
    expect(text).not.toContain("απενεργοποιείται");
  });

  it("uses correct Greek for the unavailable-product sentence", async () => {
    const text = await termsText("parangelies");

    expect(text).toContain("Αν κάποιο κομμάτι δεν είναι διαθέσιμο");
    expect(text).not.toContain("μη είναι διαθέσιμο");
  });
});
