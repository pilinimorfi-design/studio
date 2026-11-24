import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProductAttributes } from "@/components/ProductAttributes";
import type { CatalogProduct } from "@/lib/shopify";

const product: CatalogProduct = {
  id: "product-1",
  sku: "PM-12345678-1234-4234-8234-123456789abc",
  stock: 1,
  title: "Κεραμικό μπολ",
  description: "Χειροποίητο",
  handle: "keramiko-mpol",
  productType: "Μπολ",
  price: { amount: "20.00", currencyCode: "EUR" },
  imageUrl: null,
  dimensions: null,
  weightGrams: null,
  heightCm: null,
  lengthCm: null,
  widthCm: null,
  care: null,
  glazed: null,
  homeUse: null,
  fired: null,
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
          heightCm: 10,
          lengthCm: 8,
          widthCm: 6,
          glazed: false,
          homeUse: false,
          fired: false,
        }}
      />,
    );

    expect(screen.getByText("0 g")).toBeInTheDocument();
    expect(screen.getByText("Υ: 10 Μ: 8 Π: 6 cm")).toBeInTheDocument();
    expect(screen.getByText("Χωρίς υάλωμα")).toBeInTheDocument();
    expect(screen.getByText("Μη κατάλληλο")).toBeInTheDocument();
    expect(screen.getByText("Όχι")).toBeInTheDocument();
  });
});
