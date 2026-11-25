import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "node:crypto";
import { getSimulatedPaymentUrls } from "@/lib/simulated-payment";
import { ACS_PRICE_PER_PARCEL, packBoxNowItems } from "@/lib/shipping";
import type { Json } from "@/integrations/supabase/types";

const orderConfirmationSchema = z.object({ orderId: z.string().uuid() });
const shipmentItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});
const shippingPackageSchema = z.object({
  size: z.enum(["small", "medium", "large", "acs"]),
  volumeCm3: z.number().positive().nullable(),
  items: z.array(shipmentItemSchema).min(1),
  locker: z
    .object({
      id: z.string().min(1).max(100),
      name: z.string().min(1).max(300),
      addressLine: z.string().max(300),
      postalCode: z.string().max(32),
    })
    .nullable(),
});
const simulatedOrderSchema = z
  .object({
    cartToken: z.string().uuid(),
    customerName: z.string().trim().min(2).max(150),
    email: z.string().trim().email().max(254),
    phone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Το τηλέφωνο πρέπει να έχει 10 ψηφία."),
    shippingMethod: z.enum(["boxnow", "acs"]),
    lockerId: z.string().max(100),
    lockerName: z.string().max(300),
    lockerAddressLine: z.string().max(300),
    lockerPostalCode: z.string().max(32),
    shippingPackages: z.array(shippingPackageSchema).min(1).max(100),
    shippingAddress: z.string().max(300),
    shippingPostalCode: z.string().max(5),
    shippingCity: z.string().max(150),
    shippingCounty: z.string().max(150),
    shippingNotes: z.string().max(1000),
  })
  .superRefine((data, context) => {
    if (data.shippingMethod !== "acs") return;
    const [municipality, village] = data.shippingCity.split("/").map((part) => part.trim());
    if (!municipality || !village) {
      context.addIssue({
        code: "custom",
        message: "Συμπληρώστε Δήμο/Πόλη και Χωριό.",
        path: ["shippingCity"],
      });
    }
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
    const tokenHash = cartTokenHash(data.cartToken);
    const { data: cartRows, error: cartError } = await supabaseAdmin
      .from("cart_items")
      .select("product_id, quantity")
      .eq("cart_token_hash", tokenHash);
    if (cartError) throw new Error(`Η φόρτωση του καλαθιού απέτυχε: ${cartError.message}`);
    if (!cartRows?.length) throw new Error("Το καλάθι είναι άδειο ή δεν είναι διαθέσιμο.");

    const { data: productRows, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, title, height_cm, length_cm, width_cm")
      .in(
        "id",
        cartRows.map((item) => item.product_id),
      )
      .eq("is_published", true);
    if (productsError)
      throw new Error(`Η επαλήθευση των προϊόντων απέτυχε: ${productsError.message}`);

    const productsById = new Map((productRows ?? []).map((product) => [product.id, product]));
    const cartItems = cartRows.map((item) => {
      const product = productsById.get(item.product_id);
      if (!product) throw new Error("Ένα προϊόν του καλαθιού δεν είναι πλέον διαθέσιμο.");
      return {
        productId: product.id,
        title: product.title,
        quantity: item.quantity,
        heightCm: product.height_cm,
        lengthCm: product.length_cm,
        widthCm: product.width_cm,
      };
    });

    let shippingAmount: number;
    let shippingPackages: Array<{
      size: string;
      volumeCm3: number | null;
      items: Array<{ productId: string; quantity: number }>;
      locker: {
        id: string;
        name: string;
        addressLine: string;
        postalCode: string;
      } | null;
    }>;

    if (data.shippingMethod === "boxnow") {
      const quote = packBoxNowItems(cartItems);
      if (quote.error) throw new Error(quote.error);
      if (quote.packages.length !== data.shippingPackages.length) {
        throw new Error("Τα δέματα του αιτήματος δεν αντιστοιχούν στον όγκο του καλαθιού.");
      }

      shippingPackages = quote.packages.map((parcel, index) => {
        const submitted = data.shippingPackages[index];
        if (!submitted) throw new Error("Μη έγκυρο δεδομένο αποστολής.");
        const submittedItems = new Map(
          submitted.items.map((item) => [item.productId, item.quantity]),
        );
        const expectedItems = new Map(parcel.items.map((item) => [item.productId, item.quantity]));
        if (
          submitted.size !== parcel.size ||
          Math.abs((submitted.volumeCm3 ?? -1) - parcel.volumeCm3) > 0.01 ||
          submittedItems.size !== expectedItems.size ||
          [...expectedItems].some(
            ([productId, quantity]) => submittedItems.get(productId) !== quantity,
          ) ||
          !submitted.locker
        ) {
          throw new Error("Ελέγξτε την κατανομή προϊόντων και την επιλογή locker σε κάθε δέμα.");
        }

        return {
          size: parcel.size,
          volumeCm3: parcel.volumeCm3,
          items: parcel.items.map(({ productId, quantity }) => ({ productId, quantity })),
          locker: submitted.locker,
        };
      });
      shippingAmount = quote.packages.reduce((total, parcel) => total + parcel.price, 0);
    } else {
      if (data.shippingPackages.length !== 1) {
        throw new Error("Η ACS υποστηρίζει προσωρινά ένα δέμα ανά παραγγελία.");
      }
      const submitted = data.shippingPackages[0];
      if (!submitted) throw new Error("Μη έγκυρο δεδομένο αποστολής.");
      const submittedItems = new Map(
        submitted.items.map((item) => [item.productId, item.quantity]),
      );
      if (
        submitted.size !== "acs" ||
        submitted.locker !== null ||
        submittedItems.size !== cartItems.length ||
        cartItems.some((item) => submittedItems.get(item.productId) !== item.quantity)
      ) {
        throw new Error("Τα προϊόντα του δέματος ACS δεν αντιστοιχούν στο καλάθι.");
      }
      shippingPackages = [
        {
          size: "acs",
          volumeCm3: null,
          items: cartItems.map(({ productId, quantity }) => ({ productId, quantity })),
          locker: null,
        },
      ];
      shippingAmount = ACS_PRICE_PER_PARCEL;
    }

    if (!shippingPackages[0]) throw new Error("Μη έγκυρο δεδομένο αποστολής.");

    const { data: orderId, error } = await supabaseAdmin.rpc(
      "create_simulated_guest_order_with_locker",
      {
        p_cart_token_hash: tokenHash,
        p_customer_name: data.customerName,
        p_email: data.email,
        p_phone: data.phone,
        p_shipping_method: data.shippingMethod,
        p_locker_id: shippingPackages[0].locker?.id ?? data.lockerId,
        p_locker_name: shippingPackages[0].locker?.name ?? data.lockerName,
        p_shipping_address: data.shippingAddress,
        p_shipping_postal_code: data.shippingPostalCode,
        p_shipping_city: data.shippingCity,
        p_shipping_county: data.shippingCounty,
        p_shipping_notes: data.shippingNotes,
        p_locker_address: shippingPackages[0].locker?.addressLine ?? data.lockerAddressLine,
        p_locker_postal_code: shippingPackages[0].locker?.postalCode ?? data.lockerPostalCode,
        p_shipping_amount: shippingAmount,
        p_shipping_packages: shippingPackages as Json,
      },
    );

    if (error) throw new Error(`Η δοκιμαστική παραγγελία απέτυχε: ${error.message}`);
    return { orderId, ...getSimulatedPaymentUrls(orderId) };
  });

export const getSimulatedOrderJourney = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof orderConfirmationSchema>) =>
    orderConfirmationSchema.parse(input),
  )
  .handler(async ({ data }) => {
    assertSimulationIsEnabled();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "order_number, customer_name, email, total_amount, currency, payment_status, is_test, shipping_method, boxnow_locker_id, boxnow_locker_name, boxnow_locker_address, boxnow_locker_postal_code",
      )
      .eq("id", data.orderId)
      .eq("is_test", true)
      .maybeSingle();

    if (error) throw new Error(`Η φόρτωση της δοκιμαστικής παραγγελίας απέτυχε: ${error.message}`);
    if (!order) throw new Error("Δεν βρέθηκε δοκιμαστική παραγγελία.");
    if (order.payment_status !== "paid") {
      throw new Error(
        "Η προεπισκόπηση αποστολής είναι διαθέσιμη μετά την επιτυχή δοκιμαστική πληρωμή.",
      );
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("title, quantity, unit_price")
      .eq("order_id", data.orderId);

    if (itemsError)
      throw new Error(`Η φόρτωση ειδών της παραγγελίας απέτυχε: ${itemsError.message}`);

    return { ...order, items: items ?? [] };
  });

export const resolveSimulatedPayment = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof simulatedPaymentResultSchema>) =>
    simulatedPaymentResultSchema.parse(input),
  )
  .handler(async ({ data }) => {
    assertSimulationIsEnabled();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const successful = data.result === "success";
    const { error } = await supabaseAdmin.rpc("resolve_simulated_order_payment", {
      p_order_id: data.orderId,
      p_successful: successful,
    });

    if (error) throw new Error(`Η ενημέρωση δοκιμαστικής πληρωμής απέτυχε: ${error.message}`);

    return {
      redirectUrl: getSimulatedPaymentUrls(data.orderId)[
        data.result === "success" ? "successUrl" : "cancelUrl"
      ],
    };
  });
