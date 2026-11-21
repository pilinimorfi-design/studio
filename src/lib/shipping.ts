export const BOXNOW_PACKAGES = [
  { size: "small", label: "Μικρό", heightCm: 8, lengthCm: 45, widthCm: 60, price: 4 },
  { size: "medium", label: "Μεσαίο", heightCm: 17, lengthCm: 45, widthCm: 60, price: 5 },
  { size: "large", label: "Μεγάλο", heightCm: 36, lengthCm: 45, widthCm: 60, price: 10 },
] as const;
export const ACS_PRICE_PER_PARCEL = 12;

export type BoxNowPackageSize = (typeof BOXNOW_PACKAGES)[number]["size"];

export interface ShippingProduct {
  productId: string;
  title: string;
  quantity: number;
  heightCm: number | null | undefined;
  lengthCm: number | null | undefined;
  widthCm: number | null | undefined;
}

export interface BoxNowPackage {
  size: BoxNowPackageSize;
  volumeCm3: number;
  price: number;
  items: Array<{ productId: string; title: string; quantity: number }>;
}

export interface BoxNowPackingResult {
  packages: BoxNowPackage[];
  error: string | null;
}

function fitsLocker(
  dimensions: readonly number[],
  locker: (typeof BOXNOW_PACKAGES)[number],
): boolean {
  const itemSides = [...dimensions].sort((first, second) => second - first);
  const lockerSides = [locker.heightCm, locker.lengthCm, locker.widthCm].sort(
    (first, second) => second - first,
  );
  return itemSides.every((side, index) => side <= lockerSides[index]);
}

export function packBoxNowItems(items: readonly ShippingProduct[]): BoxNowPackingResult {
  const units: Array<{
    productId: string;
    title: string;
    volumeCm3: number;
    dimensions: number[];
  }> = [];
  for (const item of items) {
    const dimensions = [item.heightCm, item.lengthCm, item.widthCm];
    if (
      dimensions.some((dimension) => !dimension || !Number.isFinite(dimension) || dimension <= 0)
    ) {
      return {
        packages: [],
        error: `Δεν υπάρχουν έγκυρες διαστάσεις συσκευασίας για το προϊόν «${item.title}».`,
      };
    }

    const packedDimensions = dimensions.map((dimension) => dimension!);
    const volumeCm3 = packedDimensions.reduce((volume, dimension) => volume * dimension, 1);
    if (
      volumeCm3 >
        BOXNOW_PACKAGES[2].heightCm * BOXNOW_PACKAGES[2].lengthCm * BOXNOW_PACKAGES[2].widthCm ||
      !BOXNOW_PACKAGES.some((locker) => fitsLocker(packedDimensions, locker))
    ) {
      return {
        packages: [],
        error: `Το προϊόν «${item.title}» δεν χωράει στη μεγαλύτερη θυρίδα BoxNow.`,
      };
    }

    for (let index = 0; index < item.quantity; index += 1) {
      units.push({
        productId: item.productId,
        title: item.title,
        volumeCm3,
        dimensions: packedDimensions,
      });
    }
  }

  units.sort(
    (first, second) =>
      second.volumeCm3 - first.volumeCm3 || first.productId.localeCompare(second.productId),
  );
  const packages: Array<{
    size: BoxNowPackageSize;
    volumeCm3: number;
    largestItemVolumeCm3: number;
    itemDimensions: number[][];
    items: Map<string, { title: string; quantity: number }>;
  }> = [];

  for (const unit of units) {
    const fittingPackage = packages
      .map((parcel) => {
        const totalVolume = parcel.volumeCm3 + unit.volumeCm3;
        const largestItemVolume = Math.max(parcel.largestItemVolumeCm3, unit.volumeCm3);
        const size = BOXNOW_PACKAGES.find(
          (candidate) =>
            candidate.heightCm * candidate.lengthCm * candidate.widthCm >=
              Math.max(totalVolume, largestItemVolume) &&
            [...parcel.itemDimensions, unit.dimensions].every((dimensions) =>
              fitsLocker(dimensions, candidate),
            ) &&
            fitsLocker(unit.dimensions, candidate),
        );
        return size
          ? {
              parcel,
              size,
              remaining: size.heightCm * size.lengthCm * size.widthCm - totalVolume,
            }
          : null;
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
      .sort((first, second) => first.remaining - second.remaining)[0];

    const parcel =
      fittingPackage?.parcel ??
      (() => {
        const parcelSize = BOXNOW_PACKAGES.find(
          (size) =>
            size.heightCm * size.lengthCm * size.widthCm >= unit.volumeCm3 &&
            fitsLocker(unit.dimensions, size),
        )!;
        const created = {
          size: parcelSize.size,
          volumeCm3: 0,
          largestItemVolumeCm3: 0,
          itemDimensions: [],
          items: new Map<string, { title: string; quantity: number }>(),
        };
        packages.push(created);
        return created;
      })();

    if (fittingPackage) parcel.size = fittingPackage.size.size;
    parcel.volumeCm3 += unit.volumeCm3;
    parcel.largestItemVolumeCm3 = Math.max(parcel.largestItemVolumeCm3, unit.volumeCm3);
    parcel.itemDimensions.push(unit.dimensions);
    const parcelItem = parcel.items.get(unit.productId);
    if (parcelItem) parcelItem.quantity += 1;
    else parcel.items.set(unit.productId, { title: unit.title, quantity: 1 });
  }

  return {
    packages: packages.map((parcel) => ({
      size: parcel.size,
      volumeCm3: parcel.volumeCm3,
      price: BOXNOW_PACKAGES.find((size) => size.size === parcel.size)!.price,
      items: [...parcel.items].map(([productId, item]) => ({
        productId,
        title: item.title,
        quantity: item.quantity,
      })),
    })),
    error: null,
  };
}

export function getBoxNowPackagePrice(size: BoxNowPackageSize): number {
  return BOXNOW_PACKAGES.find((parcel) => parcel.size === size)!.price;
}
