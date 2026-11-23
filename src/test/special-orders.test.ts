import { describe, expect, it } from "vitest";

import { specialOrderSchema } from "@/lib/special-orders";

describe("special order inquiry validation", () => {
  const validInput = {
    fullName: "Μαρία Παπαδοπούλου",
    phone: "2101234567",
    email: "maria@example.com",
    quantity: 24,
    technicalDetails: "Κεραμικά μπολ με διάμετρο 15 εκατοστά σε γήινη απόχρωση.",
    deliveryWindowUnit: "Εβδομάδες",
    deliveryWindowFrom: 6,
    deliveryWindowTo: 8,
    deliveryWindow: "Από 6 έως 8 εβδομάδες",
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
    expect(specialOrderSchema.safeParse({ ...validInput, quantity: 19 }).success).toBe(false);
    expect(specialOrderSchema.safeParse({ ...validInput, quantity: 20 }).success).toBe(true);
  });

  it("requires a 10-digit phone number", () => {
    for (const phone of ["210123456", "21012345678", "21012abc67", "+302101234567"]) {
      expect(specialOrderSchema.safeParse({ ...validInput, phone }).success).toBe(false);
    }

    expect(specialOrderSchema.safeParse({ ...validInput, phone: "2101234567" }).success).toBe(true);
  });

  it("rejects delivery 'Από' < 15 for Ημέρες", () => {
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Ημέρες",
        deliveryWindowFrom: 14,
        deliveryWindowTo: 20,
      }).success,
    ).toBe(false);
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Ημέρες",
        deliveryWindowFrom: 15,
        deliveryWindowTo: 30,
      }).success,
    ).toBe(true);
  });

  it("rejects delivery 'Από' < 2 for Εβδομάδες", () => {
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Εβδομάδες",
        deliveryWindowFrom: 1,
        deliveryWindowTo: 5,
      }).success,
    ).toBe(false);
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Εβδομάδες",
        deliveryWindowFrom: 2,
        deliveryWindowTo: 5,
      }).success,
    ).toBe(true);
  });

  it("rejects delivery 'Έως' < 30 for Ημέρες", () => {
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Ημέρες",
        deliveryWindowFrom: 15,
        deliveryWindowTo: 29,
      }).success,
    ).toBe(false);
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Ημέρες",
        deliveryWindowFrom: 15,
        deliveryWindowTo: 30,
      }).success,
    ).toBe(true);
  });

  it("rejects delivery 'Έως' < 4 for Εβδομάδες", () => {
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Εβδομάδες",
        deliveryWindowFrom: 2,
        deliveryWindowTo: 3,
      }).success,
    ).toBe(false);
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Εβδομάδες",
        deliveryWindowFrom: 2,
        deliveryWindowTo: 4,
      }).success,
    ).toBe(true);
  });

  it("rejects delivery 'Έως' < 'Από'", () => {
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Ημέρες",
        deliveryWindowFrom: 30,
        deliveryWindowTo: 29,
      }).success,
    ).toBe(false);
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Εβδομάδες",
        deliveryWindowFrom: 5,
        deliveryWindowTo: 4,
      }).success,
    ).toBe(false);
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Ημέρες",
        deliveryWindowFrom: 15,
        deliveryWindowTo: 30,
      }).success,
    ).toBe(true);
    expect(
      specialOrderSchema.safeParse({
        ...validInput,
        deliveryWindowUnit: "Εβδομάδες",
        deliveryWindowFrom: 2,
        deliveryWindowTo: 4,
      }).success,
    ).toBe(true);
  });
});
