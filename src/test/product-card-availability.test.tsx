import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The card links to the product page; render the link as a plain anchor so the
// test does not need a router instance.
vi.mock("@tanstack/react-router", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children }: any) => <a>{children}</a>,
}));

import { ProductCard } from "@/components/ProductCard";
import type { ShopifyProduct } from "@/lib/shopify";

function product(availableForSale: boolean): ShopifyProduct {
  return {
    node: {
      id: "gid://shopify/Product/1",
      title: "Πήλινο Μπολ",
      description: "Χειροποίητο κεραμικό μπολ",
      handle: "pihino-mbol",
      productType: "Μπολ",
      priceRange: { minVariantPrice: { amount: "25.00", currencyCode: "EUR" } },
      images: { edges: [] },
      variants: {
        edges: [
          {
            node: {
              id: "gid://shopify/ProductVariant/1",
              title: "Default Title",
              sku: "PM-MPL-001",
              price: { amount: "25.00", currencyCode: "EUR" },
              availableForSale,
              selectedOptions: [],
            },
          },
        ],
      },
      options: [],
    },
  };
}

describe("ProductCard — διαθεσιμότητα", () => {
  afterEach(cleanup);

  it("does not render the add-to-cart button when the product is not available", () => {
    render(<ProductCard product={product(false)} />);

    expect(screen.queryByRole("button", { name: "Προσθήκη στο καλάθι" })).toBeNull();
    expect(screen.getByText("Εξαντλήθηκε")).toBeInTheDocument();
  });

  it("renders the add-to-cart button when the product is available", () => {
    render(<ProductCard product={product(true)} />);

    expect(screen.getByRole("button", { name: "Προσθήκη στο καλάθι" })).toBeInTheDocument();
    expect(screen.queryByText("Εξαντλήθηκε")).toBeNull();
  });
});
