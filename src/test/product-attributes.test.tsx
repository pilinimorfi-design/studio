import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProductAttributes } from "@/components/ProductAttributes";
import type { CatalogProduct } from "@/lib/shopify";

const product: CatalogProduct = {
  id: "product-1",
  sku: "PM-12345678-1234-4234-8234-123456789abc",
  title: "Κεραμικό μπολ",
  description: "Χειροποίητο",
  handle: "keramiko-mpol",
  productType: "Μπολ",
  price: { amount: "20.00", currencyCode: "EUR" },
  imageUrl: null,
  dimensions: null,
  weightGrams: null,
  care: null,
  glazed: null,
  fired: null,
  homeUse: null,
};

describe("ProductAttributes", () => {
  afterEach(cleanup);

  it("does not render a characteristics list when no product attributes are set", () => {
    const { container } = render(<ProductAttributes product={product} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows only populated values and preserves explicit false values", () => {
    render(
      <ProductAttributes
        product={{
          ...product,
          weightGrams: 0,
          dimensions: "10 × 8 cm",
          glazed: false,
          fired: true,
          homeUse: false,
        }}
      />,
    );

    expect(screen.getByText("0 g")).toBeInTheDocument();
    expect(screen.getByText("10 × 8 cm")).toBeInTheDocument();
    expect(screen.getByText("Χωρίς υάλωμα")).toBeInTheDocument();
    expect(screen.getByText("Ψημένο")).toBeInTheDocument();
    expect(screen.getByText("Μη κατάλληλο")).toBeInTheDocument();
  });
});
