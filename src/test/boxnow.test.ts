import { describe, expect, it } from "vitest";

import { getBoxNowPartnerId, parseBoxNowLocker } from "@/lib/boxnow";

describe("BoxNow widget data", () => {
  it("extracts the selected locker fields", () => {
    expect(
      parseBoxNowLocker({
        boxnowLockerId: "7721",
        boxnowLockerName: "Ακαδημίας 86",
        boxnowLockerAddressLine1: "Ακαδημίας 86",
        boxnowLockerPostalCode: "10672",
      }),
    ).toEqual({
      id: "7721",
      name: "Ακαδημίας 86",
      addressLine: "Ακαδημίας 86",
      postalCode: "10672",
    });
  });

  it("rejects malformed or incomplete locker selections", () => {
    expect(parseBoxNowLocker(null)).toBeNull();
    expect(parseBoxNowLocker({ boxnowLockerId: "", boxnowLockerName: "Locker" })).toBeNull();
    expect(parseBoxNowLocker({ boxnowLockerId: "1", boxnowLockerName: " ".repeat(2) })).toBeNull();
  });

  it("accepts only a positive integer partner ID", () => {
    expect(getBoxNowPartnerId("1234")).toBe(1234);
    expect(getBoxNowPartnerId(undefined)).toBeNull();
    expect(getBoxNowPartnerId("0")).toBeNull();
    expect(getBoxNowPartnerId("12x")).toBeNull();
  });
});
