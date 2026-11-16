import { describe, expect, it } from "vitest";

import { getSimulatedPaymentUrls } from "@/lib/simulated-payment";

describe("simulated payment redirect URLs", () => {
  it("generates local mock checkout and success/failure return URLs", () => {
    const urls = getSimulatedPaymentUrls("test-order-123");

    expect(urls).toEqual({
      paymentUrl: "/mock-payment?orderId=test-order-123",
      successUrl: "/mock-order-journey?orderId=test-order-123",
      cancelUrl: "/order-confirmation?orderId=test-order-123&simulation=failure",
    });
  });

  it("encodes the order ID as a URL component", () => {
    const urls = getSimulatedPaymentUrls("id with spaces");

    expect(urls.paymentUrl).toContain("orderId=id%20with%20spaces");
  });
});
