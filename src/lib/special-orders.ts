import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const specialOrderSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Γράψτε το ονοματεπώνυμό σας.")
    .max(150, "Το ονοματεπώνυμο πρέπει να είναι έως 150 χαρακτήρες."),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία."),
  email: z
    .string()
    .trim()
    .email("Γράψτε ένα έγκυρο email.")
    .max(254, "Το email πρέπει να είναι έως 254 χαρακτήρες."),
  quantity: z
    .number()
    .int("Η ποσότητα πρέπει να είναι ακέραιος αριθμός.")
    .min(20, "Η ελάχιστη ποσότητα είναι 20 τεμάχια.")
    .max(999999, "Η ποσότητα είναι πολύ μεγάλη."),
  technicalDetails: z
    .string()
    .trim()
    .min(10, "Περιγράψτε τις τεχνικές λεπτομέρειες με τουλάχιστον 10 χαρακτήρες.")
    .max(3000, "Οι τεχνικές λεπτομέρειες πρέπει να είναι έως 3000 χαρακτήρες."),
  deliveryWindow: z
    .string()
    .trim()
    .min(2, "Γράψτε το επιθυμητό χρονικό περιθώριο παράδοσης.")
    .max(150, "Το χρονικό περιθώριο πρέπει να είναι έως 150 χαρακτήρες."),
});

export type SpecialOrderInput = z.infer<typeof specialOrderSchema>;

export const submitSpecialOrderInquiry = createServerFn({ method: "POST" })
  .validator((input: SpecialOrderInput) => specialOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("special_order_inquiries").insert({
      full_name: data.fullName,
      phone: data.phone,
      email: data.email,
      quantity: data.quantity,
      technical_details: data.technicalDetails,
      delivery_window: data.deliveryWindow,
    });

    if (error) {
      console.error("Failed to save special order inquiry:", error);
      throw new Error("Δεν ήταν δυνατή η αποστολή του αιτήματος. Δοκιμάστε ξανά.");
    }

    return { ok: true as const };
  });
