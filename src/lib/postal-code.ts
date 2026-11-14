import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const postalCodeSchema = z
  .string()
  .regex(/^\d{5}$/, "Ο ταχυδρομικός κώδικας πρέπει να έχει 5 ψηφία.");
const nominatimResultSchema = z.array(
  z.object({
    address: z
      .object({
        postcode: z.string().optional(),
        city: z.string().optional(),
        town: z.string().optional(),
        village: z.string().optional(),
        hamlet: z.string().optional(),
        municipality: z.string().optional(),
        city_district: z.string().optional(),
        county: z.string().optional(),
        state: z.string().optional(),
      })
      .passthrough()
      .optional(),
  }),
);

export interface GreekPostalCodeAddress {
  city: string | null;
  county: string | null;
}

export function parseGreekPostalCodeAddress(
  results: unknown,
  postalCode: string,
): GreekPostalCodeAddress | null {
  const parsed = nominatimResultSchema.safeParse(results);
  if (!parsed.success) return null;

  const result = parsed.data.find(
    (item) => item.address?.postcode?.replace(/\D/g, "") === postalCode,
  );
  const address = result?.address;
  if (!address) return null;

  const city =
    address.city?.trim() ||
    address.town?.trim() ||
    address.village?.trim() ||
    address.hamlet?.trim() ||
    address.municipality?.trim() ||
    address.city_district?.trim() ||
    null;
  const county = address.county?.trim() || address.state?.trim() || null;
  return city || county ? { city, county } : null;
}

const cache = new Map<string, { address: GreekPostalCodeAddress | null; expiresAt: number }>();
const inFlightLookups = new Map<string, Promise<GreekPostalCodeAddress | null>>();
const nominatimSearchUrl =
  process.env["NOMINATIM_SEARCH_URL"] ?? "https://nominatim.openstreetmap.org/search";
let nextAllowedRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

async function fetchGreekPostalCodeAddress(
  postalCode: string,
): Promise<GreekPostalCodeAddress | null> {
  const request = requestQueue.then(async () => {
    const wait = Math.max(0, nextAllowedRequestAt - Date.now());
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    nextAllowedRequestAt = Date.now() + 1000;

    const url = new URL(nominatimSearchUrl);
    url.search = new URLSearchParams({
      postalcode: postalCode,
      country: "Greece",
      format: "jsonv2",
      addressdetails: "1",
      limit: "5",
      "accept-language": "el",
    }).toString();

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PilinimorfiStudio/1.0 (Greek postal-code city lookup)",
      },
    });
    if (!response.ok) {
      throw new Error(`Η αναζήτηση ταχυδρομικού κώδικα απέτυχε (HTTP ${response.status}).`);
    }

    const results: unknown = await response.json();
    return parseGreekPostalCodeAddress(results, postalCode);
  });
  requestQueue = request.then(
    () => undefined,
    () => undefined,
  );
  return request;
}

export const lookupGreekPostalCode = createServerFn({ method: "POST" })
  .validator((input: string) => postalCodeSchema.parse(input))
  .handler(async ({ data }) => {
    const cached = cache.get(data);
    if (cached && cached.expiresAt > Date.now()) return cached.address;

    const existing = inFlightLookups.get(data);
    if (existing) return existing;

    const lookup = fetchGreekPostalCodeAddress(data).then(
      (address) => {
        cache.set(data, {
          address,
          expiresAt: Date.now() + (address ? 24 * 60 * 60 * 1000 : 10 * 60 * 1000),
        });
        return address;
      },
      (error: unknown) => {
        throw error;
      },
    );
    inFlightLookups.set(data, lookup);
    try {
      return await lookup;
    } finally {
      inFlightLookups.delete(data);
    }
  });
