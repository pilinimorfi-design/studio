export interface BoxNowLocker {
  id: string;
  name: string;
  addressLine: string | null;
  postalCode: string | null;
}

export function parseBoxNowLocker(selected: unknown): BoxNowLocker | null {
  if (!selected || typeof selected !== "object") return null;

  const data = selected as Record<string, unknown>;
  const id = typeof data["boxnowLockerId"] === "string" ? data["boxnowLockerId"].trim() : "";
  const name = typeof data["boxnowLockerName"] === "string" ? data["boxnowLockerName"].trim() : "";
  if (!id || id.length > 100 || !name || name.length > 300) return null;

  const address = data["boxnowLockerAddressLine1"];
  const postalCode = data["boxnowLockerPostalCode"];

  return {
    id,
    name,
    addressLine:
      typeof address === "string" && address.trim().length <= 300 ? address.trim() || null : null,
    postalCode:
      typeof postalCode === "string" && postalCode.trim().length <= 32
        ? postalCode.trim() || null
        : null,
  };
}

export function getBoxNowPartnerId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const partnerId = Number(value);
  return Number.isSafeInteger(partnerId) && partnerId > 0 ? partnerId : null;
}
