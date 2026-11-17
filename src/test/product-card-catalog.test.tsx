import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const productCardMocks = vi.hoisted(() => ({
  addItem: vi.fn(async () => {}),
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => productCardMocks.navigate,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children }: any) => <a>{children}</a>,
}));
vi.mock("@/stores/cartStore", () => ({
  useCartStore: (
    selector: (state: { addItem: () => Promise<void>; isLoading: boolean }) => unknown,
  ) => selector({ addItem: productCardMocks.addItem, isLoading: false }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ProductCard } from "@/components/ProductCard";
import type { CatalogProduct } from "@/lib/shopify";

const product: CatalogProduct = {
  id: "product-1",
  sku: "PM-12345678-1234-4234-8234-123456789abc",
  stock: 1,
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
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows product details and allows adding the item to the cart", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByText("Πήλινο Μπολ")).toBeInTheDocument();
    expect(screen.getByText("Χειροποίητο κεραμικό μπολ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Προσθήκη στο καλάθι" })).toHaveClass("bg-primary");
    expect(screen.getByRole("button", { name: "Αγορά Τώρα" })).toHaveClass("bg-primary", "h-8");
  });

  it("adds the product and navigates to checkout when buying now", async () => {
    render(<ProductCard product={product} />);

    fireEvent.click(screen.getByRole("button", { name: "Αγορά Τώρα" }));

    await waitFor(() => {
      expect(productCardMocks.addItem).toHaveBeenCalledWith(product);
      expect(productCardMocks.navigate).toHaveBeenCalledWith({ to: "/checkout" });
    });
  });

  it("disables purchase actions when the product has no stock", () => {
    render(<ProductCard product={{ ...product, stock: 0 }} />);

    expect(screen.getByRole("button", { name: "Προσθήκη στο καλάθι" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Αγορά Τώρα" })).toBeDisabled();
  });
});
