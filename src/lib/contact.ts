import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Γράψτε το όνομά σας" })
    .max(100, { message: "Το όνομα πρέπει να είναι έως 100 χαρακτήρες" }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{10,16}$/, { message: "Γράψτε έναν έγκυρο αριθμό τηλεφώνου" }),
  message: z
    .string()
    .trim()
    .min(10, { message: "Το μήνυμα πρέπει να έχει τουλάχιστον 10 χαρακτήρες" })
    .max(1000, { message: "Το μήνυμα πρέπει να είναι έως 1000 χαρακτήρες" }),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const submitContactMessage = createServerFn({ method: "POST" })
  .validator((input: ContactInput) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false },
      // Opaque sb_ keys aren't JWTs; send only apikey, not the default Authorization bearer.
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { error } = await supabase.from("contact_submissions").insert({
      name: data.name,
      phone: data.phone,
      message: data.message,
    });
    if (error) throw new Error("Η αποστολή απέτυχε. Δοκιμάστε ξανά.");
    return { ok: true as const };
  });
