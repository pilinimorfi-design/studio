import { useState, useEffect } from "react";
import { createUuid } from "@/lib/uuid";

const DEVICE_ID_KEY = "pilinimorfi_device_id";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 έτος σε δευτερόλεπτα

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let existing = localStorage.getItem(DEVICE_ID_KEY);
    if (!existing) {
      existing = createUuid();
      localStorage.setItem(DEVICE_ID_KEY, existing);
    }

    // Αποθήκευση στο cookie για 1 έτος (path=/)
    document.cookie = `${DEVICE_ID_KEY}=${existing}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;

    setDeviceId(existing);
  }, []);

  return deviceId;
}
