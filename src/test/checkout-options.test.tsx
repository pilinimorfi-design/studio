import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const checkoutMocks = vi.hoisted(() => ({
  postalCodeLookup: vi.fn(),
  createSimulatedOrder: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children }: any) => <a>{children}</a>,
}));
vi.mock("@/stores/cartStore", () => ({
  useCartStore: (
    selector: (state: {
      items: Array<{ product: object; quantity: number }>;
      cartToken: string;
      clearLocalCart: () => void;
    }) => unknown,
  ) =>
    selector({
      items: [
        {
          product: {
            id: "product-1",
            title: "Πήλινο Μπολ",
            price: { amount: "25.00", currencyCode: "EUR" },
          },
          quantity: 1,
        },
      ],
      cartToken: "11111111-1111-4111-8111-111111111111",
      clearLocalCart: vi.fn(),
    }),
}));
vi.mock("@/components/BoxNowLockerPicker", () => ({
  BoxNowLockerPicker: () => <button type="button">Επιλογή BoxNow Locker στον χάρτη</button>,
}));
vi.mock("@/lib/postal-code", () => ({
  lookupGreekPostalCode: checkoutMocks.postalCodeLookup,
}));
vi.mock("@/lib/orders", () => ({
  createSimulatedOrder: checkoutMocks.createSimulatedOrder,
}));

import { CheckoutPage } from "@/components/CheckoutPage";

describe("Checkout options", () => {
  beforeEach(() => {
    checkoutMocks.postalCodeLookup.mockReset();
    checkoutMocks.createSimulatedOrder.mockReset();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(cleanup);
  afterEach(() => vi.unstubAllGlobals());

  it("offers payment and shipping choices and asks for ACS delivery details", async () => {
    checkoutMocks.postalCodeLookup.mockResolvedValue({
      city: "Αθήνα",
      county: "Κεντρικός Τομέας Αθηνών",
    });
    render(<CheckoutPage />);

    expect(screen.getByRole("radio", { name: /Κάρτα μέσω EveryPay/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Αντικαταβολή/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /BoxNow Locker/ })).toBeChecked();
    expect(screen.getByRole("button", { name: /Επιλογή BoxNow Locker/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /ACS Courier/ })).toBeInTheDocument();
    expect(screen.queryByLabelText("Οδός και αριθμός")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Τηλέφωνο επικοινωνίας")).toBeRequired();
    expect(checkoutMocks.postalCodeLookup).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("radio", { name: /ACS Courier/ }));
    expect(screen.getByLabelText("Τηλέφωνο επικοινωνίας")).toBeRequired();
    expect(screen.getByLabelText("Νομός")).toBeInTheDocument();
    const postalCode = screen.getByLabelText("Ταχυδρομικός κώδικας");
    const county = screen.getByLabelText("Νομός");
    const municipality = screen.getByLabelText("Δήμος/Πόλη");
    const village = screen.getByLabelText("Χωριό");
    const street = screen.getByLabelText("Οδός και αριθμός");
    expect(
      postalCode.compareDocumentPosition(county) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      county.compareDocumentPosition(municipality) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(municipality.closest(".grid")).toBe(village.closest(".grid"));
    expect(village.compareDocumentPosition(street) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(postalCode).toHaveClass("sm:max-w-[calc(50%-0.625rem)]");
    expect(screen.getByLabelText("Σχόλια παράδοσης")).toHaveAttribute(
      "placeholder",
      "Πρόσθεσε σχόλια παράδοσης",
    );
    fireEvent.change(screen.getByLabelText("Ταχυδρομικός κώδικας"), {
      target: { value: "10558" },
    });
    await waitFor(() =>
      expect(checkoutMocks.postalCodeLookup).toHaveBeenCalledWith({ data: "10558" }),
    );
    expect(await screen.findByLabelText("Δήμος/Πόλη")).toHaveValue("Αθήνα");
    expect(screen.getByLabelText("Χωριό")).toBeRequired();
    expect(screen.getByLabelText("Νομός")).toHaveValue("Κεντρικός Τομέας Αθηνών");

    fireEvent.change(screen.getByLabelText("Νομός"), {
      target: { value: "Αττική" },
    });
    expect(screen.getByLabelText("Νομός")).toHaveValue("Αττική");

    fireEvent.click(screen.getByRole("radio", { name: /Αντικαταβολή/ }));

    expect(screen.getByLabelText("Οδός και αριθμός")).toBeRequired();
    expect(screen.getByLabelText("Ταχυδρομικός κώδικας")).toBeRequired();
    expect(screen.getByLabelText("Δήμος/Πόλη")).toBeRequired();
    expect(screen.getByLabelText("Χωριό")).toBeRequired();
    expect(screen.getByRole("radio", { name: /Αντικαταβολή/ })).toBeChecked();
    expect(
      screen.getByRole("button", { name: /Η αντικαταβολή δεν προσομοιώνεται/ }),
    ).toBeDisabled();
  });

  it("combines municipality and required village and translates server validation errors", async () => {
    checkoutMocks.postalCodeLookup.mockResolvedValue({
      city: "Αθήνα",
      county: "Κεντρικός Τομέας Αθηνών",
    });
    checkoutMocks.createSimulatedOrder.mockRejectedValue(
      new Error(
        JSON.stringify([
          {
            validation: "email",
            code: "invalid_string",
            message: "Invalid email",
            path: ["email"],
          },
        ]),
      ),
    );
    render(<CheckoutPage />);

    fireEvent.click(screen.getByRole("radio", { name: /ACS Courier/ }));
    fireEvent.change(screen.getByLabelText("Ονοματεπώνυμο"), {
      target: { value: "Μαρία Παπαδοπούλου" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "maria@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Τηλέφωνο επικοινωνίας"), {
      target: { value: "2101234567" },
    });
    fireEvent.change(screen.getByLabelText("Οδός και αριθμός"), {
      target: { value: "Οδός 1" },
    });
    fireEvent.change(screen.getByLabelText("Ταχυδρομικός κώδικας"), {
      target: { value: "10558" },
    });
    await screen.findByDisplayValue("Αθήνα");
    fireEvent.change(screen.getByLabelText("Χωριό"), {
      target: { value: "Μπολάτι" },
    });

    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() =>
      expect(checkoutMocks.createSimulatedOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shippingCity: "Αθήνα / Μπολάτι" }),
        }),
      ),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Μη έγκυρο email. Συμπληρώστε σωστά τη διεύθυνση email.",
    );
  });

  it("shows field-specific validation as soon as the customer leaves a field", () => {
    render(<CheckoutPage />);

    const email = screen.getByLabelText("Email");
    fireEvent.change(email, { target: { value: "invalid" } });
    fireEvent.blur(email);
    expect(
      screen.getByText("Μη έγκυρο email. Συμπληρώστε σωστά τη διεύθυνση email."),
    ).toBeVisible();

    const phone = screen.getByLabelText("Τηλέφωνο επικοινωνίας");
    fireEvent.change(phone, { target: { value: "12345" } });
    fireEvent.blur(phone);
    expect(screen.getByText("Συμπληρώστε σωστά τον 10ψήφιο αριθμό τηλεφώνου.")).toBeVisible();

    fireEvent.click(screen.getByRole("radio", { name: /ACS Courier/ }));
    const address = screen.getByLabelText("Οδός και αριθμός");
    fireEvent.change(address, { target: { value: "12" } });
    fireEvent.blur(address);
    expect(
      screen.getByText("Η διεύθυνση πρέπει να έχει τουλάχιστον 3 και έως 300 χαρακτήρες."),
    ).toBeVisible();
  });
});
