import type { CatalogProduct } from "@/lib/shopify";

type ProductAttributesProps = {
  product: CatalogProduct;
  packaging?: boolean;
};

export function ProductAttributes({ product, packaging = false }: ProductAttributesProps) {
  const attributes = [
    typeof product.weightGrams === "number" && {
      label: "Βάρος",
      value: `${product.weightGrams} g`,
    },
    (product.heightCm != null || product.lengthCm != null || product.widthCm != null) && {
      label: "Διαστάσεις",
      value: packaging
        ? `Υ: ${Number((Number(product.heightCm) + 1).toFixed(2))} Μ: ${Number((Number(product.lengthCm) + 1).toFixed(2))} Π: ${Number((Number(product.widthCm) + 1).toFixed(2))} cm`
        : `Υ: ${product.heightCm ?? ""} Μ: ${product.lengthCm ?? ""} Π: ${product.widthCm ?? ""} cm`,
    },
    product.glazed != null && {
      label: "Υάλωμα",
      value: product.glazed ? "Υαλωμένο" : "Χωρίς υάλωμα",
    },
    product.homeUse != null && {
      label: "Οικιακή χρήση",
      value: product.homeUse ? "Κατάλληλο" : "Μη κατάλληλο",
    },
    {
      label: "Πυρίμαχο",
      value: product.fired ? "Ναι" : "Όχι",
    },
  ].filter((attribute): attribute is { label: string; value: string } => Boolean(attribute));

  if (!attributes.length) return null;

  return (
    <ul
      aria-label="Χαρακτηριστικά προϊόντος"
      className="flex flex-col gap-1 text-sm text-muted-foreground"
    >
      {attributes.map(({ label, value }) => (
        <li key={label}>
          <span className="font-medium text-foreground">{label}:</span> {value}
        </li>
      ))}
    </ul>
  );
}
