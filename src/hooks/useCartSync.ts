import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";

export function useCartSync() {
  const loadCart = useCartStore((s) => s.loadCart);
  useEffect(() => {
    loadCart();
    const onVis = () => {
      if (document.visibilityState === "visible") loadCart();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadCart]);
}
