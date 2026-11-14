import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderConfirmationSchema = z.object({ orderId: z.string().uuid() });

export const getOrderConfirmation = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof orderConfirmationSchema>) =>
    orderConfirmationSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("order_number, status, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();

    if (error) throw new Error(`Η επιβεβαίωση της παραγγελίας απέτυχε: ${error.message}`);
    return order;
  });
