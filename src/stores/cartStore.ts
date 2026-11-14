import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  addGuestCartItem,
  getGuestCart,
  removeGuestCartItem,
  updateGuestCartItem,
  type GuestCartItem,
} from "@/lib/cart";
import type { CatalogProduct } from "@/lib/shopify";

interface CartStore {
  cartToken: string | null;
  items: GuestCartItem[];
  isLoading: boolean;
  error: string | null;
  loadCart: () => Promise<void>;
  addItem: (product: CatalogProduct) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
}

function getOrCreateCartToken(cartToken: string | null) {
  return cartToken ?? crypto.randomUUID();
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cartToken: null,
      items: [],
      isLoading: false,
      error: null,

      loadCart: async () => {
        const { cartToken } = get();
        if (!cartToken) return;
        try {
          const items = await getGuestCart({ data: { cartToken } });
          set({ items, error: null });
        } catch (error) {
          console.error("Failed to load cart:", error);
          set({ error: "Δεν ήταν δυνατή η φόρτωση του καλαθιού." });
        }
      },

      addItem: async (product) => {
        const cartToken = getOrCreateCartToken(get().cartToken);
        set({ cartToken, isLoading: true, error: null });
        try {
          const items = await addGuestCartItem({
            data: { cartToken, productId: product.id, quantity: 1 },
          });
          set({ items });
        } catch (error) {
          console.error("Failed to add cart item:", error);
          set({ error: "Δεν ήταν δυνατή η προσθήκη του προϊόντος στο καλάθι." });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (productId, quantity) => {
        const { cartToken } = get();
        if (!cartToken) return;
        if (quantity <= 0) return get().removeItem(productId);
        set({ isLoading: true, error: null });
        try {
          const items = await updateGuestCartItem({
            data: { cartToken, productId, quantity },
          });
          set({ items });
        } catch (error) {
          console.error("Failed to update cart item:", error);
          set({ error: "Δεν ήταν δυνατή η ενημέρωση της ποσότητας." });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (productId) => {
        const { cartToken } = get();
        if (!cartToken) return;
        set({ isLoading: true, error: null });
        try {
          const items = await removeGuestCartItem({
            data: { cartToken, productId },
          });
          set({ items });
        } catch (error) {
          console.error("Failed to remove cart item:", error);
          set({ error: "Δεν ήταν δυνατή η αφαίρεση του προϊόντος." });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "guest-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cartToken: state.cartToken, items: [] }),
    },
  ),
);
