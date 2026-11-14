import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { CatalogProduct } from "@/lib/shopify";

export interface GuestCartItem {
  product: CatalogProduct;
  quantity: number;
}

const cartTokenSchema = z.string().uuid();
const addItemSchema = z.object({
  cartToken: cartTokenSchema,
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});
const changeItemSchema = z.object({
  cartToken: cartTokenSchema,
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

type CartProductRow = {
  id: string;
  sku: string;
  title: string;
  description: string;
  handle: string;
  product_type: string;
  price: number;
  image_url: string | null;
  dimensions: string | null;
  weight_grams: number | null;
  care: string | null;
  glazed: boolean | null;
  fired: boolean | null;
  home_use: boolean | null;
};

function hashCartToken(cartToken: string) {
  return createHash("sha256").update(cartToken).digest("hex");
}

async function loadCart(cartToken: string): Promise<GuestCartItem[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cartRows, error: cartError } = await supabaseAdmin
    .from("cart_items")
    .select("product_id, quantity")
    .eq("cart_token_hash", hashCartToken(cartToken));
  if (cartError) throw new Error(`Η φόρτωση του καλαθιού απέτυχε: ${cartError.message}`);
  if (!cartRows?.length) return [];

  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select(
      "id, sku, title, description, handle, product_type, price, image_url, dimensions, weight_grams, care, glazed, fired, home_use",
    )
    .in(
      "id",
      cartRows.map((item) => item.product_id),
    )
    .eq("is_published", true);
  if (productsError)
    throw new Error(`Η φόρτωση προϊόντων καλαθιού απέτυχε: ${productsError.message}`);

  const productById = new Map(
    (products ?? []).map((product) => [product.id, product as CartProductRow]),
  );
  return cartRows.flatMap((item) => {
    const row = productById.get(item.product_id);
    if (!row) return [];
    return [
      {
        quantity: item.quantity,
        product: {
          id: row.id,
          sku: row.sku,
          title: row.title,
          description: row.description,
          handle: row.handle,
          productType: row.product_type,
          price: { amount: String(row.price), currencyCode: "EUR" },
          imageUrl: row.image_url,
          dimensions: row.dimensions,
          weightGrams: row.weight_grams,
          care: row.care,
          glazed: row.glazed,
          fired: row.fired,
          homeUse: row.home_use,
        },
      },
    ];
  });
}

export const getGuestCart = createServerFn({ method: "POST" })
  .validator((input: { cartToken: string }) =>
    z.object({ cartToken: cartTokenSchema }).parse(input),
  )
  .handler(({ data }) => loadCart(data.cartToken));

export const addGuestCartItem = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof addItemSchema>) => addItemSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("add_cart_item", {
      p_cart_token_hash: hashCartToken(data.cartToken),
      p_product_id: data.productId,
      p_quantity: data.quantity,
    });
    if (error) throw new Error(`Η προσθήκη στο καλάθι απέτυχε: ${error.message}`);
    return loadCart(data.cartToken);
  });

export const updateGuestCartItem = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof changeItemSchema>) => changeItemSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("cart_items")
      .update({ quantity: data.quantity, updated_at: new Date().toISOString() })
      .eq("cart_token_hash", hashCartToken(data.cartToken))
      .eq("product_id", data.productId);
    if (error) throw new Error(`Η ενημέρωση του καλαθιού απέτυχε: ${error.message}`);
    return loadCart(data.cartToken);
  });

export const removeGuestCartItem = createServerFn({ method: "POST" })
  .validator((input: { cartToken: string; productId: string }) =>
    z.object({ cartToken: cartTokenSchema, productId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("cart_token_hash", hashCartToken(data.cartToken))
      .eq("product_id", data.productId);
    if (error) throw new Error(`Η αφαίρεση από το καλάθι απέτυχε: ${error.message}`);
    return loadCart(data.cartToken);
  });

export const clearGuestCart = createServerFn({ method: "POST" })
  .validator((input: { cartToken: string }) =>
    z.object({ cartToken: cartTokenSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("cart_token_hash", hashCartToken(data.cartToken));
    if (error) throw new Error(`Η εκκαθάριση του καλαθιού απέτυχε: ${error.message}`);
  });
