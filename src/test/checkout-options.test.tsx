import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const postalCodeLookupMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children }: any) => <a>{children}</a>,
}));
vi.mock("@/stores/cartStore", () => ({
  useCartStore: (
    selector: (state: { items: Array<{ product: object; quantity: number }> }) => unknown,
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
    }),
}));
vi.mock("@/components/BoxNowLockerPicker", () => ({
  BoxNowLockerPicker: () => <button type="button">Επιλογή BoxNow Locker στον χάρτη</button>,
}));
vi.mock("@/lib/postal-code", () => ({
  lookupGreekPostalCode: postalCodeLookupMock,
}));

import { CheckoutPage } from "@/components/CheckoutPage";

describe("Checkout options", () => {
  beforeEach(() => {
    postalCodeLookupMock.mockReset();
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
    postalCodeLookupMock.mockResolvedValue({
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
    expect(screen.queryByLabelText("Τηλέφωνο επικοινωνίας")).not.toBeInTheDocument();
    expect(postalCodeLookupMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("radio", { name: /ACS Courier/ }));
    expect(screen.getByLabelText("Τηλέφωνο επικοινωνίας")).toBeRequired();
    expect(screen.getByLabelText("Νομός")).toBeInTheDocument();
    expect(screen.getByLabelText("Σχόλια παράδοσης")).toHaveAttribute(
      "placeholder",
      "Πρόσθεσε σχόλια παράδοσης",
    );
    fireEvent.change(screen.getByLabelText("Ταχυδρομικός κώδικας"), {
      target: { value: "10558" },
    });
    await waitFor(() => expect(postalCodeLookupMock).toHaveBeenCalledWith({ data: "10558" }));
    expect(await screen.findByLabelText("Πόλη/Χωριό")).toHaveValue("Αθήνα");
    expect(screen.getByLabelText("Νομός")).toHaveValue("Κεντρικός Τομέας Αθηνών");

    fireEvent.change(screen.getByLabelText("Νομός"), {
      target: { value: "Αττική" },
    });
    expect(screen.getByLabelText("Νομός")).toHaveValue("Αττική");

    fireEvent.click(screen.getByRole("radio", { name: /Αντικαταβολή/ }));

    expect(screen.getByLabelText("Οδός και αριθμός")).toBeRequired();
    expect(screen.getByLabelText("Ταχυδρομικός κώδικας")).toBeRequired();
    expect(screen.getByLabelText("Πόλη/Χωριό")).toBeRequired();
    expect(screen.getByRole("radio", { name: /Αντικαταβολή/ })).toBeChecked();
    expect(
      screen.getByRole("button", { name: /Η ολοκλήρωση παραγγελίας δεν είναι ακόμη διαθέσιμη/ }),
    ).toBeDisabled();
  });
});
