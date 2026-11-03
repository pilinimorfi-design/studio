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

  it("sets phone-order shipping by courier choice, weight and volume", async () => {
    const text = await ordersText();

    expect(text).toContain("τηλεφωνικές παραγγελίες");
    expect(text).toContain("έξοδα αποστολής");
    expect(text).toContain("επιλογή της μεταφορικής");
    expect(text).toContain("βάρος του αντικειμένου");
    expect(text).toContain("όγκο των αντικειμένων");
  });

  it("offers free pickup from the workshop", async () => {
    const text = await ordersText();

    expect(text).toContain("παραλαβή από το εργαστήριο Πήλινη Μορφή είναι δωρεάν");
  });
});
