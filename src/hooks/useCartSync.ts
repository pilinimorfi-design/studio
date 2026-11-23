import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import { hasCookieConsent } from "@/lib/consent";

export function useCartSync() {
  const loadCart = useCartStore((s) => s.loadCart);
  useEffect(() => {
    if (hasCookieConsent()) {
      loadCart();
    }
    const onVis = () => {
      if (document.visibilityState === "visible" && hasCookieConsent()) {
        loadCart();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadCart]);
}
