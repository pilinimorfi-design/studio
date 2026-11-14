import type { CatalogProduct } from "@/lib/shopify";

type ProductAttributesProps = {
  product: CatalogProduct;
  compact?: boolean;
};

export function ProductAttributes({ product, compact = false }: ProductAttributesProps) {
  const attributes = [
    typeof product.weightGrams === "number" && {
      label: "Βάρος",
      value: `${product.weightGrams} g`,
    },
    product.dimensions?.trim() && {
      label: "Διαστάσεις",
      value: product.dimensions,
    },
    product.glazed != null && {
      label: "Υάλωμα",
      value: product.glazed ? "Υαλωμένο" : "Χωρίς υάλωμα",
    },
    product.fired != null && {
      label: "Ψήσιμο",
      value: product.fired ? "Ψημένο" : "Άψητο",
    },
    product.homeUse != null && {
      label: "Οικιακή χρήση",
      value: product.homeUse ? "Κατάλληλο" : "Μη κατάλληλο",
    },
  ].filter((attribute): attribute is { label: string; value: string } => Boolean(attribute));

  if (!attributes.length) return null;

  return (
    <ul
      aria-label="Χαρακτηριστικά προϊόντος"
      className={
        compact
          ? "flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
          : "grid gap-y-2 text-sm text-muted-foreground"
      }
    >
      {attributes.map(({ label, value }) => (
        <li key={label}>
          <span className="font-medium text-foreground">{label}:</span> {value}
        </li>
      ))}
    </ul>
  );
}
