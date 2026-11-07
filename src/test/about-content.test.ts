import { describe, expect, it } from "vitest";
import { siteContent } from "@/content/site";

const USER_PARAGRAPHS = [
  "Στο εργαστήριο \"Πήλινη Μορφή\", η δημιουργία ξεκινά από τη μαγεία της χειροτεχνίας. Όλα άρχισαν όταν ήρθα για πρώτη φορά σε επαφή με τον τροχό της αγγειοπλαστικής. Εκείνη τη στιγμή, η αίσθηση του πηλού που δαμάζεται κάτω από τα δάχτυλα με συνεπήρε.",
  "Κάθε αντικείμενο που δημιουργώ κουβαλάει τη δική του έμπνευση και μοναδική ομορφιά. Με οδηγεί η αγάπη προς τον πηλό, δίνοντας σε κάθε δημιουργία μια ξεχωριστή ψυχή.",
  "Αυτή είναι η φιλοσοφία του εργαστηρίου \"Πήλινη Μορφή\", όπου κάθε κομμάτι αποτελεί μια ξεχωριστή έκφραση κεραμικής τέχνης.",
];

describe("Σχετικά με εμάς — εκτενές κείμενο", () => {
  it("keeps the copy the user supplied word for word", async () => {
    const about = await siteContent.getAbout();

    for (const paragraph of USER_PARAGRAPHS) {
      expect(about.paragraphs).toContain(paragraph);
    }
  });

  it("keeps the user's closing sentence as the last paragraph", async () => {
    const about = await siteContent.getAbout();

    expect(about.paragraphs[about.paragraphs.length - 1]).toBe(USER_PARAGRAPHS[2]);
  });

  it("tells the journey that starts with the love for clay", async () => {
    const about = await siteContent.getAbout();
    const text = about.paragraphs.join(" ");

    expect(text).toContain("Η πορεία μου ξεκινάει από την αγάπη μου για τον πηλό");
    expect(text).toContain("μοναδικών χειροποίητων αντικειμένων");
  });

  it("describes the passion for pottery", async () => {
    const about = await siteContent.getAbout();
    const text = about.paragraphs.join(" ");

    expect(text).toContain("Η αγγειοπλαστική για μένα δεν είναι απλώς μια τέχνη, είναι πάθος");
  });

  it("describes the philosophy of the workshop", async () => {
    const about = await siteContent.getAbout();
    const text = about.paragraphs.join(" ");

    expect(text).toContain("Η φιλοσοφία του εργαστηρίου είναι απλή");
    expect(text).toContain("δεν φτιάχνω σειρές");
  });

  it("stays in first person singular", async () => {
    const about = await siteContent.getAbout();
    const text = about.paragraphs.join(" ");

    expect(text).toContain("ήρθα");
    expect(text).toContain("δημιουργώ");
    expect(text).toContain("Πιστεύω");
    expect(text).not.toContain("πιστεύουμε");
    expect(text).not.toContain("δημιουργούμε");
  });
});
