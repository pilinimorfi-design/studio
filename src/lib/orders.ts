import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "node:crypto";
import { getSimulatedPaymentUrls } from "@/lib/simulated-payment";

const orderConfirmationSchema = z.object({ orderId: z.string().uuid() });
const simulatedOrderSchema = z.object({
  cartToken: z.string().uuid(),
  customerName: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(32),
  shippingMethod: z.enum(["boxnow", "acs"]),
  lockerId: z.string().max(100),
  lockerName: z.string().max(300),
  shippingAddress: z.string().max(300),
  shippingPostalCode: z.string().max(5),
  shippingCity: z.string().max(150),
  shippingCounty: z.string().max(150),
  shippingNotes: z.string().max(1000),
});
const simulatedPaymentResultSchema = z.object({
  orderId: z.string().uuid(),
  result: z.enum(["success", "failure"]),
});

function assertSimulationIsEnabled() {
  if (process.env["NODE_ENV"] !== "development") {
    throw new Error("Η προσομοίωση πληρωμών είναι διαθέσιμη μόνο σε περιβάλλον ανάπτυξης.");
  }
}

function cartTokenHash(cartToken: string) {
  return createHash("sha256").update(cartToken).digest("hex");
}

export const getOrderConfirmation = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof orderConfirmationSchema>) =>
    orderConfirmationSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("order_number, status, payment_status, is_test")
      .eq("id", data.orderId)
      .maybeSingle();

    if (error) throw new Error(`Η επιβεβαίωση της παραγγελίας απέτυχε: ${error.message}`);
    if (!order) return null;
    if (order.is_test || order.payment_status !== "paid") return { ...order, review_rating: null };

    const { data: review, error: reviewError } = await supabaseAdmin
      .from("order_reviews")
      .select("rating")
      .eq("order_id", data.orderId)
      .maybeSingle();

    if (reviewError) throw new Error(`Η φόρτωση της αξιολόγησης απέτυχε: ${reviewError.message}`);
    return { ...order, review_rating: review?.rating ?? null };
  });

export const createSimulatedOrder = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof simulatedOrderSchema>) => simulatedOrderSchema.parse(input))
  .handler(async ({ data }) => {
    assertSimulationIsEnabled();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orderId, error } = await supabaseAdmin.rpc("create_simulated_guest_order", {
      p_cart_token_hash: cartTokenHash(data.cartToken),
      p_customer_name: data.customerName,
      p_email: data.email,
      p_phone: data.phone,
      p_shipping_method: data.shippingMethod,
      p_locker_id: data.lockerId,
      p_locker_name: data.lockerName,
      p_shipping_address: data.shippingAddress,
      p_shipping_postal_code: data.shippingPostalCode,
      p_shipping_city: data.shippingCity,
      p_shipping_county: data.shippingCounty,
      p_shipping_notes: data.shippingNotes,
    });

    if (error) throw new Error(`Η δοκιμαστική παραγγελία απέτυχε: ${error.message}`);
    return { orderId, ...getSimulatedPaymentUrls(orderId) };
  });

export const resolveSimulatedPayment = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof simulatedPaymentResultSchema>) =>
    simulatedPaymentResultSchema.parse(input),
  )
  .handler(async ({ data }) => {
    assertSimulationIsEnabled();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const successful = data.result === "success";
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({
        status: successful ? "paid" : "payment_failed",
        payment_status: successful ? "paid" : "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.orderId)
      .eq("is_test", true)
      .eq("payment_provider", "simulation")
      .eq("payment_status", "pending")
      .select("id")
      .maybeSingle();

    if (error) throw new Error(`Η ενημέρωση δοκιμαστικής πληρωμής απέτυχε: ${error.message}`);
    if (!order)
      throw new Error("Η δοκιμαστική πληρωμή δεν είναι διαθέσιμη ή έχει ήδη ολοκληρωθεί.");

    return {
      redirectUrl: getSimulatedPaymentUrls(data.orderId)[
        data.result === "success" ? "successUrl" : "cancelUrl"
      ],
    };
  });
