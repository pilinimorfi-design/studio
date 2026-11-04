import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";

async function sectionText(id: string) {
  const terms = await siteContent.getSeminarTerms();
  return terms.sections.find((s) => s.id === id)?.paragraphs.join(" ") ?? "";
}

describe("Όροι Συμμετοχής Σεμιναρίων — εγγραφή", () => {
  it("keeps the registration open by email or phone", async () => {
    const text = await sectionText("eggrafi");

    expect(text).toContain("Η εγγραφή γίνεται με email ή τηλέφωνο");
  });

  it("gives the limited seats by order of priority with a waiting list", async () => {
    const text = await sectionText("eggrafi");

    expect(text).toContain("σειρά προτεραιότητας");
    expect(text).toContain("λίστα αναμονής");
  });

  it("finalizes the registration only after the deposit is paid", async () => {
    const text = await sectionText("eggrafi");

    expect(text).toContain("Η εγγραφή οριστικοποιείται με την πληρωμή της προκαταβολής");
  });

  it("holds the seat with a 50% deposit", async () => {
    const text = await sectionText("pliri");

    expect(text).toContain("προκαταβολή 50%");
  });
});

describe("Όροι Συμμετοχής Σεμιναρίων — ακύρωση", () => {
  it("refunds the deposit in full when cancelling at least 7 days before", async () => {
    const text = await sectionText("akysi-esas");

    expect(text).toContain("τουλάχιστον 7 μέρες πριν");
    expect(text).toContain("επιστρέφεται πλήρως");
  });

  it("moves the deposit to another seminar between 7 days and 48 hours", async () => {
    const text = await sectionText("akysi-esas");

    expect(text).toContain("από 7 έως 48 ώρες");
    expect(text).toContain("μεταφέρετε σε επόμενο σεμινάριο");
  });

  it("keeps the deposit when cancelling later than 48 hours before", async () => {
    const text = await sectionText("akysi-esas");

    expect(text).toContain("λιγότερο από 48 ώρες");
    expect(text).toContain("δεν επιστρέφεται και δεν μεταφέρεται");
  });

  it("refunds everything if the workshop reschedules and the new date does not suit", async () => {
    const text = await sectionText("akysi-ergastiri");

    expect(text).toContain("αναβληθεί το σεμινάριο από το εργαστήριο");
    expect(text).toContain("νέα ημερομηνία");
    expect(text).toContain("επιστρέφεται πλήρως ό,τι έχετε πληρώσει");
  });

  it("refunds when the minimum number of participants is not reached", async () => {
    const text = await sectionText("akysi-ergastiri");

    expect(text).toContain("ελάχιστος αριθμός συμμετεχόντων");
    expect(text).toContain("σας επιστρέφουμε ό,τι έχετε πληρώσει");
  });
});
