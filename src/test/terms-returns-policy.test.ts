import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";

async function returnsSection() {
  const terms = await siteContent.getTerms();
  const section = terms.sections.find((s) => s.id === "epistrofes");
  return { section, text: section?.paragraphs.join(" ") ?? "" };
}

describe("Όροι Χρήσης — επιστροφές", () => {
  it("has an Επιστροφές section stating product returns are not accepted", async () => {
    const { section, text } = await returnsSection();

    expect(section?.title).toBe("Επιστροφές");
    expect(text).toContain("Δεν δεχόμαστε επιστροφές προϊόντων");
  });

  it("offers a refund when the product arrives broken", async () => {
    const { text } = await returnsSection();

    expect(text).toContain("Επιστροφή χρημάτων");
    expect(text).toContain("φτάσει σπασμένο");
  });

  it("requires photo documentation within 2 days after delivery", async () => {
    const { text } = await returnsSection();

    expect(text).toContain("φωτογραφία");
    expect(text).toContain("2 μέρες");
    expect(text).toContain("παραλαβή");
  });

  it("charges the shipping costs to the buyer", async () => {
    const { text } = await returnsSection();

    expect(text).toContain("Τα μεταφορικά τα χρεώνεται ο αγοραστής");
  });
});
