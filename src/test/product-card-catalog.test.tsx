import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children }: any) => <a>{children}</a>,
}));
vi.mock("@/stores/cartStore", () => ({
  useCartStore: (
    selector: (state: { addItem: () => Promise<void>; isLoading: boolean }) => unknown,
  ) => selector({ addItem: async () => {}, isLoading: false }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ProductCard } from "@/components/ProductCard";
import type { CatalogProduct } from "@/lib/shopify";

const product: CatalogProduct = {
  id: "product-1",
  sku: "PM-12345678-1234-4234-8234-123456789abc",
  title: "Πήλινο Μπολ",
  description: "Χειροποίητο κεραμικό μπολ",
  handle: "pihino-mpol",
  productType: "Μπολ",
  price: { amount: "25.00", currencyCode: "EUR" },
  imageUrl: null,
  dimensions: null,
  weightGrams: null,
  care: null,
  glazed: null,
  fired: null,
  homeUse: null,
};

describe("ProductCard — δημόσιος κατάλογος Supabase", () => {
  afterEach(cleanup);

  it("shows product details and allows adding the item to the cart", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByText("Πήλινο Μπολ")).toBeInTheDocument();
    expect(screen.getByText("Χειροποίητο κεραμικό μπολ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Προσθήκη στο καλάθι" })).toBeInTheDocument();
  });
});
