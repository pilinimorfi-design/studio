import { describe, expect, it } from "vitest";

import { createProductHandle, createProductSku } from "@/lib/shopify";

describe("product SKU generation", () => {
  it("creates a distinct SKU for every new product", () => {
    const skus = Array.from({ length: 100 }, () => createProductSku());

    expect(new Set(skus).size).toBe(skus.length);
    expect(
      skus.every((sku) =>
        /^PM-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sku),
      ),
    ).toBe(true);
  });

  describe("product URL generation", () => {
    it("uses a readable Greek category and product title with the unique SKU", () => {
      const sku = "PM-12345678-1234-4234-8234-123456789abc";

      expect(createProductHandle("Μπολ", "Χειροποίητο Μπολ", sku)).toBe(
        "mpol-cheiropoiito-mpol-pm-12345678-1234-4234-8234-123456789abc",
      );
    });

    it("keeps the handle within a predictable length for long titles", () => {
      const sku = "PM-12345678-1234-4234-8234-123456789abc";
      const handle = createProductHandle("Κεραμικά", "Κούπα ".repeat(30), sku);

      expect(handle.endsWith(sku.toLowerCase())).toBe(true);
      expect(handle.length).toBeLessThanOrEqual(160);
    });
  });
});
