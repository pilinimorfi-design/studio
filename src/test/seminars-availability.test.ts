import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";

describe("Σεμινάρια — διαθεσιμότητα", () => {
  it("says the seminars are not available at the moment", async () => {
    const status = await siteContent.getSeminarsStatus();

    expect(status.available).toBe(false);
    expect(status.notice).toBe("Τα σεμινάρια δεν είναι διαθέσιμα προς το παρόν.");
  });

  it("marks every seminar format as not available", async () => {
    const seminars = await siteContent.getSeminars();

    expect(seminars.length).toBeGreaterThan(0);
    expect(seminars.every((s) => s.available === false)).toBe(true);
  });

  it("gives the workshop mobile number for enquiries", async () => {
    const { contact } = await siteContent.getSeminarsStatus();

    expect(contact.phone.replace(/\s/g, "")).toBe("6980413589");
    expect(contact.phoneHref).toBe("tel:+306980413589");
  });

  it("leaves the email unset until the corporate address is ready", async () => {
    const contact = await siteContent.getContact();

    expect(contact.email).toBeNull();
  });

  it("keeps the participation terms on the page for future use", async () => {
    const terms = await siteContent.getSeminarTerms();

    expect(terms.sections.map((s) => s.id)).toEqual([
      "eggrafi",
      "pliri",
      "akysi-esas",
      "akysi-ergastiri",
      "symmetoxi",
      "ulika",
    ]);
  });

  it("lists the phone in the registration rules", async () => {
    const terms = await siteContent.getSeminarTerms();
    const text = terms.sections.find((s) => s.id === "eggrafi")?.paragraphs.join(" ") ?? "";

    expect(text).toContain("698 041 3589");
  });

  it("lists the phone in the privacy policy contact details", async () => {
    const privacy = await siteContent.getPrivacy();
    const text = privacy.sections.map((s) => s.paragraphs.join(" ")).join(" ");

    expect(text).toContain("698 041 3589");
  });
});
