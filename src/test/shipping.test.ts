import { describe, expect, it } from "vitest";

import { packBoxNowItems } from "@/lib/shipping";

describe("BoxNow parcel packing", () => {
  it("chooses the smallest locker size that holds a packaged product", () => {
    const products = [
      {
        productId: "small-product",
        title: "Μικρό",
        quantity: 1,
        heightCm: 8,
        lengthCm: 45,
        widthCm: 60,
      },
      {
        productId: "medium-product",
        title: "Μεσαίο",
        quantity: 1,
        heightCm: 17,
        lengthCm: 45,
        widthCm: 60,
      },
      {
        productId: "large-product",
        title: "Μεγάλο",
        quantity: 1,
        heightCm: 36,
        lengthCm: 45,
        widthCm: 60,
      },
    ];
    const sizes = products.map((product) => {
      const result = packBoxNowItems([product]);
      expect(result.error).toBeNull();
      return result.packages[0].size;
    });

    expect(sizes).toEqual(["small", "medium", "large"]);
  });

  it("splits quantities across parcels and promotes a parcel when needed", () => {
    const result = packBoxNowItems([
      {
        productId: "bowl",
        title: "Μπολ",
        quantity: 9,
        heightCm: 10,
        lengthCm: 30,
        widthCm: 40,
      },
    ]);

    expect(result.error).toBeNull();
    expect(result.packages).toHaveLength(2);
    expect(result.packages.map((parcel) => parcel.size)).toEqual(["large", "medium"]);
    expect(result.packages.map((parcel) => parcel.items[0].quantity)).toEqual([8, 1]);
    expect(result.packages.reduce((total, parcel) => total + parcel.price, 0)).toBe(14);
  });

  it("requires packed product dimensions and rejects items larger than the largest locker", () => {
    expect(
      packBoxNowItems([
        {
          productId: "unknown",
          title: "Άγνωστο προϊόν",
          quantity: 1,
          heightCm: null,
          lengthCm: 10,
          widthCm: 10,
        },
      ]).error,
    ).toContain("διαστάσεις");

    expect(
      packBoxNowItems([
        {
          productId: "oversized",
          title: "Μεγάλο αντικείμενο",
          quantity: 1,
          heightCm: 37,
          lengthCm: 45,
          widthCm: 60,
        },
      ]).error,
    ).toContain("μεγαλύτερη θυρίδα");
  });

  it("rejects a product side that cannot fit in any locker even when its volume is small", () => {
    const result = packBoxNowItems([
      {
        productId: "too-long",
        title: "Μακρύ αντικείμενο",
        quantity: 1,
        heightCm: 1,
        lengthCm: 1,
        widthCm: 61,
      },
    ]);

    expect(result.error).toContain("μεγαλύτερη θυρίδα");
  });
});
