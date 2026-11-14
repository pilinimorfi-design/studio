import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const categoryMocks = vi.hoisted(() => ({
  categories: [
    { id: "11111111-1111-4111-8111-111111111111", name: "Μπολ" },
    { id: "22222222-2222-4222-8222-222222222222", name: "Πιάτο" },
  ],
  listManagedProducts: vi.fn(async () => []),
  listManagedProductCategories: vi.fn(async () => categoryMocks.categories),
  createManagedProductCategory: vi.fn(async ({ data }: { data: { name: string } }) => {
    const category = {
      id: "33333333-3333-4333-8333-333333333333",
      name: data.name,
    };
    categoryMocks.categories.push(category);
    return category;
  }),
  createManagedProduct: vi.fn(),
  updateManagedProduct: vi.fn(),
  deleteManagedProduct: vi.fn(),
  createProductSku: vi.fn(() => "PM-11111111-1111-4111-8111-111111111111"),
  formatPrice: vi.fn(() => "€25,00"),
}));

vi.mock("@tanstack/react-router", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children }: any) => <a>{children}</a>,
}));
vi.mock("@/lib/shopify", () => categoryMocks);

import { ProductManagementForm } from "@/components/ProductManagementForm";

describe("ProductManagementForm categories", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    categoryMocks.categories.splice(2);
    vi.clearAllMocks();
  });

  it("loads category options from Supabase and adds a category to the list", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ProductManagementForm />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Κωδικός διαχείρισης"), {
      target: { value: "test-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Φόρτωση καταλόγου" }));

    const categorySelect = await screen.findByRole("combobox", { name: "Κατηγορία" });
    fireEvent.click(categorySelect);
    expect(await screen.findByRole("option", { name: "Μπολ" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Πιάτο" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Μπολ" }));

    fireEvent.change(screen.getByRole("textbox", { name: "Νέα κατηγορία" }), {
      target: { value: "Φλιτζάνι" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Προσθήκη" }));

    await waitFor(() => {
      expect(categoryMocks.createManagedProductCategory).toHaveBeenCalledWith({
        data: { adminPassword: "test-password", name: "Φλιτζάνι" },
      });
    });
    expect(await screen.findByText("Η κατηγορία «Φλιτζάνι» είναι διαθέσιμη.")).toBeInTheDocument();
    fireEvent.click(categorySelect);
    expect(await screen.findByRole("option", { name: "Φλιτζάνι" })).toBeInTheDocument();
  });
});
