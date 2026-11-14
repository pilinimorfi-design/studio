import { createFileRoute } from "@tanstack/react-router";

import { ProductManagementForm } from "@/components/ProductManagementForm";

export const Route = createFileRoute("/admin/products")({
  component: ProductManagementPage,
});

function ProductManagementPage() {
  return <ProductManagementForm />;
}
