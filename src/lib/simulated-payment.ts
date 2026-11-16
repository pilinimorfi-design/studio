export function getSimulatedPaymentUrls(orderId: string) {
  const orderIdParam = encodeURIComponent(orderId);
  return {
    paymentUrl: `/mock-payment?orderId=${orderIdParam}`,
    successUrl: `/mock-order-journey?orderId=${orderIdParam}`,
    cancelUrl: `/order-confirmation?orderId=${orderIdParam}&simulation=failure`,
  };
}
