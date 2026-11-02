import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";

describe("Όροι Χρήσης — επιστροφές", () => {
  it("has an Επιστροφές section stating product returns are not accepted", async () => {
    const terms = await siteContent.getTerms();
    const returns = terms.sections.find((s) => s.id === "epistrofes");

    expect(returns?.title).toBe("Επιστροφές");
    expect(returns?.paragraphs.join(" ")).toContain("Δεν δεχόμαστε επιστροφές προϊόντων");
  });
});
