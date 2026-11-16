import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export type ReviewSummary = {
  averageRating: number | null;
  reviewCount: number;
};

export async function getReviewSummary(): Promise<ReviewSummary> {
  const { data, error } = await supabase.rpc("get_order_review_summary");
  if (error) throw new Error(`Η φόρτωση των αξιολογήσεων απέτυχε: ${error.message}`);

  const summary = data[0];
  return {
    averageRating: summary?.average_rating ?? null,
    reviewCount: Number(summary?.review_count ?? 0),
  };
}

const submitReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
});

export const submitOrderReview = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof submitReviewSchema>) => submitReviewSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("payment_status, is_test")
      .eq("id", data.orderId)
      .maybeSingle();

    if (orderError) throw new Error(`Ο έλεγχος της παραγγελίας απέτυχε: ${orderError.message}`);
    if (!order || order.payment_status !== "paid" || order.is_test) {
      throw new Error("Μπορείτε να αξιολογήσετε μόνο επιβεβαιωμένη, πληρωμένη παραγγελία.");
    }

    const { error } = await supabaseAdmin
      .from("order_reviews")
      .insert({ order_id: data.orderId, rating: data.rating });

    if (error?.code === "23505") {
      throw new Error("Έχει ήδη υποβληθεί αξιολόγηση για αυτή την παραγγελία.");
    }
    if (error) throw new Error(`Η αποθήκευση της αξιολόγησης απέτυχε: ${error.message}`);

    return { rating: data.rating };
  });

export function getGoogleReviewUrl(): string | null {
  const value = import.meta.env["VITE_GOOGLE_REVIEW_URL"]?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const isGoogleHost =
      url.hostname === "google.com" ||
      url.hostname.endsWith(".google.com") ||
      url.hostname === "g.page" ||
      url.hostname === "maps.app.goo.gl";
    return url.protocol === "https:" && isGoogleHost ? url.toString() : null;
  } catch {
    return null;
  }
}
