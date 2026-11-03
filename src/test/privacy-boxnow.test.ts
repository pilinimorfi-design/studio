import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";

async function sharingText() {
  const privacy = await siteContent.getPrivacy();
  return privacy.sections.find((s) => s.id === "koinopoisi")?.paragraphs.join(" ") ?? "";
}

describe("Πολιτική Απορρήτου — BoxNow", () => {
  it("names BoxNow as the delivery provider", async () => {
    const text = await sharingText();

    expect(text).toContain("BoxNow");
    expect(text).toContain("σημείο παραλαβής");
  });

  it("no longer speaks of an unnamed courier or locker provider", async () => {
    const text = await sharingText();

    expect(text).not.toContain("εταιρεία ταχυμεταφορών ή τον πάροχο locker");
  });
});
