import { createHash, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { createUuid } from "@/lib/uuid";
import { supabase } from "@/integrations/supabase/client";

export const SHOPIFY_API_VERSION = "2026-10";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "studio-vy55w-cfsx01n2.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "26acd24df382d6314382bb46dc384791";

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    productType?: string;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          sku?: string | null;
          price: { amount: string; currencyCode: string };
          availableForSale: boolean;
          selectedOptions: Array<{ name: string; value: string }>;
        };
      }>;
    };
    options: Array<{ name: string; values: string[] }>;
    descriptionHtml?: string;
    dimensions?: { value: string } | null;
    care?: { value: string } | null;
  };
}

export interface CatalogProduct {
  id: string;
  sku: string;
  categoryId?: string | null;
  title: string;
  description: string;
  handle: string;
  productType: string;
  price: { amount: string; currencyCode: string };
  imageUrl: string | null;
  dimensions: string | null;
  weightGrams: number | null;
  care: string | null;
  glazed: boolean | null;
  fired: boolean | null;
  homeUse: boolean | null;
}

export interface ManagedProduct extends CatalogProduct {
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedProductCategory {
  id: string;
  name: string;
}

type ProductRow = {
  id: string;
  sku: string;
  category_id: string | null;
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
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

function mapCatalogProduct(row: ProductRow): ManagedProduct {
  return {
    id: row.id,
    sku: row.sku,
    categoryId: row.category_id,
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
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PRODUCT_SELECT =
  "id, sku, category_id, title, description, handle, product_type, price, image_url, dimensions, weight_grams, care, glazed, fired, home_use, is_published, created_at, updated_at";

async function verifyProductAdminPassword(password: string) {
  const expectedPassword = process.env["PRODUCT_ADMIN_PASSWORD"];
  if (!expectedPassword) {
    throw new Error(
      "Ορίστε τη μεταβλητή PRODUCT_ADMIN_PASSWORD στον server για τη διαχείριση προϊόντων.",
    );
  }

  const submittedHash = createHash("sha256").update(password).digest();
  const expectedHash = createHash("sha256").update(expectedPassword).digest();
  if (!timingSafeEqual(submittedHash, expectedHash)) {
    throw new Error("Ο κωδικός διαχείρισης δεν είναι σωστός.");
  }
}

const adminPasswordSchema = z.object({ adminPassword: z.string().min(1).max(256) });

export const listManagedProductCategories = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof adminPasswordSchema>) => adminPasswordSchema.parse(input))
  .handler(async ({ data }) => {
    await verifyProductAdminPassword(data.adminPassword);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("product_categories")
      .select("id, name")
      .order("name");
    if (error) throw new Error(`Η φόρτωση των κατηγοριών απέτυχε: ${error.message}`);
    return rows;
  });

const createCategorySchema = adminPasswordSchema.extend({
  name: z.string().trim().min(1).max(100),
});

export const createManagedProductCategory = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof createCategorySchema>) => createCategorySchema.parse(input))
  .handler(async ({ data }) => {
    await verifyProductAdminPassword(data.adminPassword);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: category, error } = await supabaseAdmin
      .from("product_categories")
      .insert({ name: data.name })
      .select("id, name")
      .single();

    if (error?.code === "23505") {
      const { data: rows, error: lookupError } = await supabaseAdmin
        .from("product_categories")
        .select("id, name");
      if (lookupError) {
        throw new Error(`Η φόρτωση της υπάρχουσας κατηγορίας απέτυχε: ${lookupError.message}`);
      }
      const existing = rows.find(
        (row) =>
          row.name.trim().toLocaleLowerCase("el") === data.name.trim().toLocaleLowerCase("el"),
      );
      if (existing) return existing;
    }

    if (error) throw new Error(`Η αποθήκευση της κατηγορίας απέτυχε: ${error.message}`);
    return category;
  });

export const listManagedProducts = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof adminPasswordSchema>) => adminPasswordSchema.parse(input))
  .handler(async ({ data }) => {
    await verifyProductAdminPassword(data.adminPassword);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("products")
      .select(PRODUCT_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Η φόρτωση των προϊόντων απέτυχε: ${error.message}`);
    return (rows ?? []).map((row) => mapCatalogProduct(row as ProductRow));
  });

const productInputSchema = z.object({
  adminPassword: z.string().min(1).max(256),
  sku: z
    .string()
    .regex(/^PM-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().min(1).max(5000),
  price: z
    .string()
    .max(20)
    .regex(/^\d+(?:\.\d{1,2})?$/)
    .refine((value) => Number(value) > 0 && Number(value) <= 9999999999.99),
  categoryId: z.string().uuid(),
  imageUrl: z
    .string()
    .trim()
    .url()
    .refine((value) => new URL(value).protocol === "https:")
    .or(z.literal("")),
  dimensions: z.string().trim().max(500),
  weightGrams: z
    .string()
    .max(20)
    .regex(/^\d*(?:\.\d{1,2})?$/)
    .refine(
      (value) => value === "" || (Number.isFinite(Number(value)) && Number(value) <= 99999999.99),
    ),
  care: z.string().trim().max(2000),
  glazed: z.boolean(),
  fired: z.boolean(),
  homeUse: z.boolean(),
  isPublished: z.boolean(),
});

export type ManagedProductInput = z.infer<typeof productInputSchema>;

const updateProductSchema = productInputSchema.extend({
  id: z.string().uuid(),
});

export const createProductSku = () => `PM-${createUuid()}`;

function productHandle(title: string) {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "product"}-${createUuid().slice(0, 8)}`;
}

async function productValues(input: ManagedProductInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: category, error } = await supabaseAdmin
    .from("product_categories")
    .select("id, name")
    .eq("id", input.categoryId)
    .single();
  if (error) throw new Error(`Η επιλεγμένη κατηγορία δεν είναι διαθέσιμη: ${error.message}`);

  return {
    title: input.title,
    description: input.description,
    price: Number(input.price),
    category_id: category.id,
    product_type: category.name,
    image_url: input.imageUrl || null,
    dimensions: input.dimensions || null,
    weight_grams: input.weightGrams === "" ? null : Number(input.weightGrams),
    care: input.care || null,
    glazed: input.glazed,
    fired: input.fired,
    home_use: input.homeUse,
    is_published: input.isPublished,
    updated_at: new Date().toISOString(),
  };
}

export const createManagedProduct = createServerFn({ method: "POST" })
  .validator((input: ManagedProductInput) => productInputSchema.parse(input))
  .handler(async ({ data }) => {
    await verifyProductAdminPassword(data.adminPassword);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert({
        ...(await productValues(data)),
        sku: data.sku,
        handle: productHandle(data.title),
      })
      .select(PRODUCT_SELECT)
      .single();
    if (error) throw new Error(`Η αποθήκευση του προϊόντος απέτυχε: ${error.message}`);
    return mapCatalogProduct(row as ProductRow);
  });

export const updateManagedProduct = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof updateProductSchema>) => updateProductSchema.parse(input))
  .handler(async ({ data }) => {
    await verifyProductAdminPassword(data.adminPassword);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .update(await productValues(data))
      .eq("id", data.id)
      .select(PRODUCT_SELECT)
      .single();
    if (error) throw new Error(`Η ενημέρωση του προϊόντος απέτυχε: ${error.message}`);
    return mapCatalogProduct(row as ProductRow);
  });

export const deleteManagedProduct = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof adminPasswordSchema> & { id: string }) =>
    adminPasswordSchema.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    await verifyProductAdminPassword(data.adminPassword);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(`Η διαγραφή του προϊόντος απέτυχε: ${error.message}`);
    return { ok: true as const };
  });

export async function fetchProducts(first = 24): Promise<CatalogProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(first);
  if (error) throw new Error(`Η φόρτωση του καταλόγου απέτυχε: ${error.message}`);
  return (data ?? []).map((row) => mapCatalogProduct(row as ProductRow));
}

export async function fetchProductByHandle(handle: string): Promise<CatalogProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("handle", handle)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`Η φόρτωση του προϊόντος απέτυχε: ${error.message}`);
  return data ? mapCatalogProduct(data as ProductRow) : null;
}

export async function storefrontApiRequest(
  query: string,
  variables: Record<string, unknown> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    if (typeof window !== "undefined") {
      toast.error("Shopify: Απαιτείται πληρωμή", {
        description: "Το κατάστημα χρειάζεται ενεργό πλάνο Shopify (admin.shopify.com).",
      });
    }
    return;
  }
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  if (data.errors) {
    throw new Error(
      `Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(", ")}`,
    );
  }
  return data;
}

export function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("el-GR", { style: "currency", currency: currencyCode }).format(
    parseFloat(amount),
  );
}

// ---- Cart ----
const CART_QUERY = `query cart($id: ID!) { cart(id: $id) { id totalQuantity } }`;
const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } } }
      userErrors { field message }
    }
  }`;
const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } } }
      userErrors { field message }
    }
  }`;
const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { id } userErrors { field message } }
  }`;
const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { id } userErrors { field message } }
  }`;

type UserError = { field: string[] | null; message: string };

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

function isCartNotFoundError(userErrors: UserError[]) {
  return userErrors.some(
    (e) =>
      e.message.toLowerCase().includes("cart not found") ||
      e.message.toLowerCase().includes("does not exist"),
  );
}

export async function fetchCart(cartId: string) {
  return storefrontApiRequest(CART_QUERY, { id: cartId });
}

export async function createShopifyCart(variantId: string, quantity: number) {
  const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
    input: { lines: [{ quantity, merchandiseId: variantId }] },
  });
  if (data?.data?.cartCreate?.userErrors?.length > 0) {
    console.error("Cart creation failed:", data.data.cartCreate.userErrors);
    return null;
  }
  const cart = data?.data?.cartCreate?.cart;
  if (!cart?.checkoutUrl) return null;
  const lineId = cart.lines.edges[0]?.node?.id;
  if (!lineId) return null;
  return {
    cartId: cart.id as string,
    checkoutUrl: formatCheckoutUrl(cart.checkoutUrl),
    lineId: lineId as string,
  };
}

export async function addLineToShopifyCart(cartId: string, variantId: string, quantity: number) {
  const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, {
    cartId,
    lines: [{ quantity, merchandiseId: variantId }],
  });
  const userErrors: UserError[] = data?.data?.cartLinesAdd?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) return { success: false };
  const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];
  const newLine = lines.find(
    (l: { node: { id: string; merchandise: { id: string } } }) =>
      l.node.merchandise.id === variantId,
  );
  return { success: true, lineId: newLine?.node?.id as string | undefined };
}

export async function updateShopifyCartLine(cartId: string, lineId: string, quantity: number) {
  const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });
  const userErrors: UserError[] = data?.data?.cartLinesUpdate?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  return { success: userErrors.length === 0 };
}

export async function removeLineFromShopifyCart(cartId: string, lineId: string) {
  const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds: [lineId],
  });
  const userErrors: UserError[] = data?.data?.cartLinesRemove?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  return { success: userErrors.length === 0 };
}
