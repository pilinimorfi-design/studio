import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BoxNowLockerPicker } from "@/components/BoxNowLockerPicker";

describe("BoxNowLockerPicker", () => {
  afterEach(() => {
    cleanup();
    document
      .querySelectorAll('script[src="https://widget-cdn.boxnow.gr/map-widget/client/v5.js"]')
      .forEach((script) => script.remove());
    delete window._bn_map_widget_config;
    vi.unstubAllEnvs();
  });

  it("loads the BoxNow v5 widget and passes the selected locker to its consumer", () => {
    vi.stubEnv("VITE_BOXNOW_PARTNER_ID", "1234");
    const onSelect = vi.fn();

    render(<BoxNowLockerPicker onSelect={onSelect} />);

    expect(document.querySelector(".boxnow-map-widget-button")).toBeInTheDocument();
    expect(window._bn_map_widget_config?.partnerId).toBe(1234);
    expect(window._bn_map_widget_config?.parentElement).toBe("#boxnowmap");
    expect(
      document.querySelector('script[src="https://widget-cdn.boxnow.gr/map-widget/client/v5.js"]'),
    ).toBeInTheDocument();

    act(() => window._bn_map_widget_config?.afterSelect({ boxnowLockerId: "" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Δεν ήταν δυνατή η ανάγνωση");

    act(() => {
      window._bn_map_widget_config?.afterSelect({
        boxnowLockerId: "7721",
        boxnowLockerName: "Ακαδημίας 86",
        boxnowLockerAddressLine1: "Ακαδημίας 86",
        boxnowLockerPostalCode: "10672",
      });
    });

    expect(onSelect).toHaveBeenCalledWith({
      id: "7721",
      name: "Ακαδημίας 86",
      addressLine: "Ακαδημίας 86",
      postalCode: "10672",
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the map button disabled until a partner ID is configured", () => {
    vi.stubEnv("VITE_BOXNOW_PARTNER_ID", "");

    render(<BoxNowLockerPicker onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Επιλογή BoxNow Locker στον χάρτη" })).toBeDisabled();
    expect(screen.getByText(/ρυθμιστεί το Partner ID/)).toBeInTheDocument();
  });
});
