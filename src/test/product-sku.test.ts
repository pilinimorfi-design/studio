import { describe, expect, it } from "vitest";

import { createProductSku } from "@/lib/shopify";

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
});
