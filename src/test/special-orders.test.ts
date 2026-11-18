import { describe, expect, it } from "vitest";

import { specialOrderSchema } from "@/lib/special-orders";

describe("special order inquiry validation", () => {
  const validInput = {
    fullName: "Μαρία Παπαδοπούλου",
    phone: "2101234567",
    email: "maria@example.com",
    quantity: 24,
    technicalDetails: "Κεραμικά μπολ με διάμετρο 15 εκατοστά σε γήινη απόχρωση.",
    deliveryWindow: "Εντός 6 έως 8 εβδομάδων",
  };

  it("accepts a complete wholesale inquiry", () => {
    expect(specialOrderSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects invalid email and quantity", () => {
    const result = specialOrderSchema.safeParse({
      ...validInput,
      email: "not-an-email",
      quantity: 19,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(["email", "quantity"]);
    }
  });

  it("accepts an inquiry without technical details", () => {
    expect(specialOrderSchema.safeParse({ ...validInput, technicalDetails: "" }).success).toBe(
      true,
    );
  });

  it("requires a minimum quantity of 20", () => {
    expect(specialOrderSchema.shape.quantity.safeParse(19).success).toBe(false);
    expect(specialOrderSchema.shape.quantity.safeParse(20).success).toBe(true);
  });

  it("requires a 10-digit phone number", () => {
    for (const phone of ["210123456", "21012345678", "21012abc67", "+302101234567"]) {
      expect(specialOrderSchema.shape.phone.safeParse(phone).success).toBe(false);
    }

    expect(specialOrderSchema.shape.phone.safeParse("2101234567").success).toBe(true);
  });
});
