import { describe, it, expect } from "vitest";
import { siteContent } from "@/content/site";

const text = async (id: string) => (await siteContent.getTerms()).sections.find((s) => s.id === id)!.paragraphs.join(" ");

describe("expanded terms", () => {
  it("returns: refund only for broken items within 2 days with photos", async () => {
    const t = await text("epistrofes");
    expect(t).toContain("μέσα σε 2 μέρες");
    expect(t).toContain("αλλαγή γνώμης");
  });
  it("privacy explains cookies", async () => {
    const p = (await siteContent.getPrivacy()).sections.find((s) => s.id === "cookies")!.paragraphs.join(" ");
    expect(p).toContain("απολύτως απαραίτητα");
  });
});
