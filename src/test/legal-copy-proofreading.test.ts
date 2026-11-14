import { describe, expect, it } from "vitest";

import { siteContent } from "@/content/site";

describe("Κείμενα νομικών όρων", () => {
  it("uses the correctly joined spelling in seminar terms", async () => {
    const terms = await siteContent.getSeminarTerms();
    const materials = terms.sections.find((section) => section.id === "ulika");

    expect(materials?.title).toBe("Υλικά, ψήσιμο και παραλαβή");
    expect(materials?.title).not.toMatch(/Υ\s+λικά/);
  });

  it("does not include the removed legal-advice disclaimer", async () => {
    const [terms, privacy, seminarTerms] = await Promise.all([
      siteContent.getTerms(),
      siteContent.getPrivacy(),
      siteContent.getSeminarTerms(),
    ]);
    const copy = JSON.stringify([terms, privacy, seminarTerms]);

    expect(copy).not.toContain("νομική συμβουλή");
  });
});
