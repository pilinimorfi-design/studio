import { describe, expect, it } from "vitest";

import { parseGreekPostalCodeAddress } from "@/lib/postal-code";

describe("Greek postal code lookup response", () => {
  it("extracts a city and county from an exact postal code match", () => {
    expect(
      parseGreekPostalCodeAddress(
        [
          {
            address: {
              postcode: "105 58",
              city: "Αθήνα",
              county: "Κεντρικός Τομέας Αθηνών",
              country: "Ελλάς",
            },
          },
        ],
        "10558",
      ),
    ).toEqual({ city: "Αθήνα", county: "Κεντρικός Τομέας Αθηνών" });
  });

  it("uses village fields and falls back to the region when county is unavailable", () => {
    expect(
      parseGreekPostalCodeAddress(
        [{ address: { postcode: "230 51", village: "Μονεμβασιά", state: "Πελοπόννησος" } }],
        "23051",
      ),
    ).toEqual({ city: "Μονεμβασιά", county: "Πελοπόννησος" });
    expect(
      parseGreekPostalCodeAddress([{ address: { postcode: "105 58", city: "Αθήνα" } }], "10671"),
    ).toBeNull();
    expect(parseGreekPostalCodeAddress(null, "10558")).toBeNull();
  });
});
