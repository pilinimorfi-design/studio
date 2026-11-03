import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";

async function ordersText() {
  const terms = await siteContent.getTerms();
  return terms.sections.find((s) => s.id === "parangelies")?.paragraphs.join(" ") ?? "";
}

describe("Όροι Χρήσης — λογαριασμός, BoxNow και τηλεφωνικές παραγγελίες", () => {
  it("lets customers buy without creating an account", async () => {
    const text = await ordersText();

    expect(text).toContain("χωρίς να δημιουργήσετε λογαριασμό");
  });

  it("ships orders through BoxNow based on the chosen pickup point", async () => {
    const text = await ordersText();

    expect(text).toContain("BoxNow");
    expect(text).toContain("σημείο παραλαβής");
  });

  it("charges phone-order shipping according to the customer's choice", async () => {
    const text = await ordersText();

    expect(text).toContain("τηλεφωνικές παραγγελίες");
    expect(text).toContain("έξοδα αποστολής");
    expect(text).toContain("επιλογή του πελάτη");
  });
});
