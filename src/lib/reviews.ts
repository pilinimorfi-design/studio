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

export type DeviceReviewSummary = {
  averageRating: number | null;
  reviewCount: number;
};

export async function getDeviceReviewSummary(): Promise<DeviceReviewSummary> {
  const { data, error } = await supabase.rpc("get_device_review_summary");
  if (error) throw new Error(`Η φόρτωση της σύνοψης αξιολογήσεων απέτυχε: ${error.message}`);

  const summary = data?.[0];
  return {
    averageRating: summary?.average_rating ?? null,
    reviewCount: Number(summary?.review_count ?? 0),
  };
}

function fnv1a32(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return String(hash >>> 0);
}

function isValidIpHash(hash: string | null): boolean {
  if (!hash || hash === "unknown") return false;
  return true;
}

const IPHY_TIMEOUT_MS = 2000;

async function fetchIpFromIpify(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IPHY_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: controller.signal,
    });
    const data = (await res.json()) as { ip?: string };
    return data.ip ?? "unknown";
  } catch {
    return "unknown";
  } finally {
    clearTimeout(timeout);
  }
}

export async function getClientIpHash(): Promise<string> {
  const ip = await fetchIpFromIpify();
  if (ip === "unknown") return "unknown";
  return fnv1a32(ip);
}

export type DeviceReviewResult = {
  rating: number | null;
  matchedBy: "device" | "ip" | null;
};

export async function getDeviceReview(
  deviceId: string,
  ipHash?: string,
): Promise<DeviceReviewResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Πρώτα ψάξε με device_id
  const { data: byDevice } = await supabaseAdmin
    .from("device_reviews")
    .select("rating")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (byDevice) return { rating: byDevice.rating, matchedBy: "device" };

  // Τότε ψάξε με ip_hash μόνο αν είναι έγκυρος SHA-256 hash ( όχι null / 'unknown')
  if (ipHash && isValidIpHash(ipHash)) {
    const { data: byIP } = await supabaseAdmin
      .from("device_reviews")
      .select("rating")
      .eq("ip_hash", ipHash)
      .maybeSingle();

    if (byIP) return { rating: byIP.rating, matchedBy: "ip" };
  }

  return { rating: null, matchedBy: null };
}

const submitDeviceReviewSchema = z.object({
  deviceId: z.string().min(1, "Το Αναγνωριστικό συσκευής είναι υποχρεωτικό."),
  rating: z.number().int().min(1).max(5),
  ipHash: z.string().optional(),
});

export const submitDeviceReview = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof submitDeviceReviewSchema>) =>
    submitDeviceReviewSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { deviceId, rating, ipHash } = data;

    // Ψάξε ήδη υπάρχουσα εγγραφή με device_id ή ip_hash
    let existing: { device_id: string; rating: number } | null = null;

    const { data: byDevice } = await supabaseAdmin
      .from("device_reviews")
      .select("device_id, rating")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (byDevice) {
      existing = byDevice;
    } else if (ipHash && isValidIpHash(ipHash)) {
      const { data: byIP } = await supabaseAdmin
        .from("device_reviews")
        .select("device_id, rating")
        .eq("ip_hash", ipHash)
        .maybeSingle();

      if (byIP) {
        existing = byIP;
      }
    }

    if (existing) {
      // Ενημέρωσε την υπάρχουσα εγγραφή
      const updateData: { rating: number; device_id: string; ip_hash?: string | null } = {
        rating,
        device_id: deviceId,
      };
      if (ipHash && isValidIpHash(ipHash)) {
        updateData.ip_hash = ipHash;
      }

      const { error } = await supabaseAdmin
        .from("device_reviews")
        .update(updateData)
        .eq("device_id", existing.device_id);

      if (error) throw new Error(`Η ενημέρωση της αξιολόγησης απέτυχε: ${error.message}`);
    } else {
      // Κάνε INSERT νέας αξιολόγησης
      const insertData: { device_id: string; rating: number; ip_hash?: string | null } = {
        device_id: deviceId,
        rating,
      };
      if (ipHash && isValidIpHash(ipHash)) {
        insertData.ip_hash = ipHash;
      }

      const { error } = await supabaseAdmin.from("device_reviews").insert(insertData);

      if (error) throw new Error(`Η αποθήκευση της αξιολόγησης απέτυχε: ${error.message}`);
    }

    // Άμεση ανανέωση μέσου όρου και πλήθους ψήφων από το Supabase
    const summary = await getDeviceReviewSummary();

    return {
      rating,
      matchedBy: existing ? "device" : null,
      averageRating: summary.averageRating,
      reviewCount: summary.reviewCount,
    };
  });
