export function getSimulatedPaymentUrls(orderId: string) {
  const orderIdParam = encodeURIComponent(orderId);
  return {
    paymentUrl: `/mock-payment?orderId=${orderIdParam}`,
    successUrl: `/order-confirmation?orderId=${orderIdParam}&simulation=success`,
    cancelUrl: `/order-confirmation?orderId=${orderIdParam}&simulation=failure`,
  };
}
