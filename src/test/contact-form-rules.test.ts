import { describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/contact";

const valid = { name: "Μαρία Παπαδοπούλου", phone: "698 041 3589", message: "Θα ήθελα να ρωτήσω για ένα μπολ." };

describe("contact form validation", () => {
  it("accepts a valid submission with a Greek phone containing spaces", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(contactSchema.safeParse({ ...valid, name: "Μ" }).success).toBe(false);
  });

  it("rejects a phone number with letters", () => {
    expect(contactSchema.safeParse({ ...valid, phone: "698abc3589x" }).success).toBe(false);
  });

  it("rejects a message shorter than 10 characters", () => {
    expect(contactSchema.safeParse({ ...valid, message: "Γεια σας" }).success).toBe(false);
  });

  it("rejects a message longer than 1000 characters", () => {
    expect(contactSchema.safeParse({ ...valid, message: "α".repeat(1001) }).success).toBe(false);
  });

  it("trims whitespace around the fields", () => {
    const result = contactSchema.parse({ name: "  Μαρία  ", phone: " 6980413589 ", message: "  Ερώτηση για μπολ.  " });
    expect(result.name).toBe("Μαρία");
    expect(result.phone).toBe("6980413589");
    expect(result.message).toBe("Ερώτηση για μπολ.");
  });
});
