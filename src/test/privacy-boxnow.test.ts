import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";

async function sharingText() {
  const privacy = await siteContent.getPrivacy();
  return privacy.sections.find((s) => s.id === "koinopoisi")?.paragraphs.join(" ") ?? "";
}

describe("Πολιτική Απορρήτου — πάροχοι πληρωμής και αποστολής", () => {
  it("names BoxNow and ACS as delivery providers", async () => {
    const text = await sharingText();

    expect(text).toContain("BoxNow");
    expect(text).toContain("ACS");
    expect(text).toContain("locker που επιλέξατε");
  });

  it("describes EveryPay card processing and does not share card details with the store", async () => {
    const text = await sharingText();

    expect(text).toContain("EveryPay");
    expect(text).toContain("απευθείας");
    expect(text).toContain("στοιχεία κάρτας");
  });

  it("says delivery information is shared only with the selected carrier", async () => {
    const text = await sharingText();

    expect(text).toContain("μόνο για την παράδοση");
    expect(text).toContain("που επιλέξατε");
  });
});
