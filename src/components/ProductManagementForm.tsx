import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productsQuery } from "@/lib/queries";
import {
  createManagedProductCategory,
  createManagedProduct,
  createProductSku,
  deleteManagedProduct,
  formatPrice,
  listManagedProductCategories,
  listManagedProducts,
  type ManagedProduct,
  type ManagedProductInput,
  updateManagedProduct,
} from "@/lib/shopify";

const emptyForm = () => ({
  title: "",
  description: "",
  price: "",
  categoryId: "",
  imageUrl: "",
  dimensions: "",
  weightGrams: "",
  care: "",
  glazed: false,
  fired: false,
  homeUse: false,
  isPublished: true,
});

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
      {children}
    </label>
  );
}

export function ProductManagementForm() {
  const queryClient = useQueryClient();
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");
  const [sku, setSku] = useState(createProductSku);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listManagedProducts({ data: { adminPassword } }),
    enabled: isAdmin,
    retry: false,
  });
  const categories = useQuery({
    queryKey: ["admin-product-categories"],
    queryFn: () => listManagedProductCategories({ data: { adminPassword } }),
    enabled: isAdmin,
    retry: false,
  });

  function resetForm() {
    setForm(emptyForm());
    setSku(createProductSku());
    setEditingProductId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.categoryId) {
      setError("Επιλέξτε κατηγορία για το προϊόν.");
      return;
    }
    setIsSubmitting(true);

    try {
      const input: ManagedProductInput = { adminPassword, sku, ...form };
      const product = editingProductId
        ? await updateManagedProduct({ data: { ...input, id: editingProductId } })
        : await createManagedProduct({ data: input });
      setSuccess(
        editingProductId
          ? `Οι αλλαγές στο «${product.title}» αποθηκεύτηκαν.`
          : `Το «${product.title}» προστέθηκε με κωδικό ${product.sku}.`,
      );
      resetForm();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
        queryClient.invalidateQueries({ queryKey: productsQuery.queryKey }),
      ]);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Η αποθήκευση του προϊόντος απέτυχε.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function addCategory() {
    setCategoryError("");
    setCategorySuccess("");
    setIsAddingCategory(true);
    try {
      const category = await createManagedProductCategory({
        data: { adminPassword, name: newCategoryName.trim() },
      });
      setForm((current) => ({ ...current, categoryId: category.id }));
      setNewCategoryName("");
      setCategorySuccess(`Η κατηγορία «${category.name}» είναι διαθέσιμη.`);
      await queryClient.invalidateQueries({ queryKey: ["admin-product-categories"] });
    } catch (addError) {
      setCategoryError(
        addError instanceof Error ? addError.message : "Η προσθήκη κατηγορίας απέτυχε.",
      );
    } finally {
      setIsAddingCategory(false);
    }
  }

  function editProduct(product: ManagedProduct) {
    setEditingProductId(product.id);
    setSku(product.sku);
    const categoryId =
      product.categoryId ??
      categories.data?.find(
        (category) =>
          category.name.trim().toLocaleLowerCase("el") ===
          product.productType.trim().toLocaleLowerCase("el"),
      )?.id ??
      "";
    setForm({
      title: product.title,
      description: product.description,
      price: product.price.amount,
      categoryId,
      imageUrl: product.imageUrl ?? "",
      dimensions: product.dimensions ?? "",
      weightGrams: product.weightGrams === null ? "" : String(product.weightGrams),
      care: product.care ?? "",
      glazed: product.glazed ?? false,
      fired: product.fired ?? false,
      homeUse: product.homeUse ?? false,
      isPublished: product.isPublished,
    });
    setError("");
    setSuccess("");
    document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth" });
  }

  async function removeProduct(product: ManagedProduct) {
    if (!window.confirm(`Να διαγραφεί οριστικά το «${product.title}»;`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteManagedProduct({ data: { adminPassword, id: product.id } });
      if (editingProductId === product.id) resetForm();
      setSuccess(`Το «${product.title}» διαγράφηκε.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
        queryClient.invalidateQueries({ queryKey: productsQuery.queryKey }),
      ]);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Η διαγραφή απέτυχε.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
          Διαχείριση καταστήματος
        </p>
        <h1 className="mt-3 font-display text-4xl text-foreground md:text-5xl">Προϊόντα</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Ο δημόσιος κατάλογος και τα προϊόντα του αποθηκεύονται στη Supabase. Βρες τα προϊόντα στη{" "}
          <Link to="/" className="underline underline-offset-4">
            δημόσια σελίδα καταλόγου
          </Link>
          . Το καλάθι είναι ενεργό· η ολοκλήρωση παραγγελιών θα ενεργοποιηθεί μετά τη σύνδεση
          EveryPay και των υπηρεσιών αποστολής.
        </p>
      </header>

      <section className="mb-10 rounded-lg border border-border bg-card p-6 shadow-soft md:p-8">
        <h2 className="font-display text-2xl">Πρόσβαση διαχείρισης</h2>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            setIsAdmin(true);
            void products.refetch();
          }}
        >
          <div className="w-full max-w-md">
            <FieldLabel htmlFor="admin-password">Κωδικός διαχείρισης</FieldLabel>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={products.isFetching}>
            {products.isFetching ? "Έλεγχος..." : "Φόρτωση καταλόγου"}
          </Button>
        </form>
        {products.isError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {products.error instanceof Error
              ? products.error.message
              : "Δεν ήταν δυνατή η φόρτωση των προϊόντων."}
          </p>
        )}
      </section>

      {isAdmin && categories.isError && (
        <p role="alert" className="mb-6 text-sm text-destructive">
          {categories.error instanceof Error
            ? categories.error.message
            : "Δεν ήταν δυνατή η φόρτωση των κατηγοριών."}
        </p>
      )}

      {isAdmin && products.isSuccess && categories.isSuccess && (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <section
            id="product-form"
            className="rounded-lg border border-border bg-card p-6 shadow-soft md:p-8"
          >
            <h2 className="font-display text-2xl">
              {editingProductId ? "Επεξεργασία προϊόντος" : "Νέο προϊόν"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ο μοναδικός κωδικός SKU δημιουργείται αυτόματα.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <FieldLabel htmlFor="product-title">Τίτλος</FieldLabel>
                <Input
                  id="product-title"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  required
                  minLength={2}
                  maxLength={150}
                />
              </div>
              <div>
                <FieldLabel htmlFor="product-description">Περιγραφή</FieldLabel>
                <Textarea
                  id="product-description"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  required
                  maxLength={5000}
                  rows={5}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="product-price">Τιμή (€)</FieldLabel>
                  <Input
                    id="product-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="product-category">Κατηγορία</FieldLabel>
                  <Select
                    value={form.categoryId}
                    onValueChange={(categoryId) => setForm({ ...form, categoryId })}
                    required
                  >
                    <SelectTrigger id="product-category" aria-label="Κατηγορία">
                      <SelectValue placeholder="Επιλέξτε κατηγορία" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.data.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-3 flex gap-2">
                    <Input
                      aria-label="Νέα κατηγορία"
                      placeholder="Προσθήκη νέας κατηγορίας"
                      value={newCategoryName}
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      maxLength={100}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isAddingCategory || !newCategoryName.trim()}
                      onClick={() => void addCategory()}
                    >
                      {isAddingCategory ? "Προσθήκη..." : "Προσθήκη"}
                    </Button>
                  </div>
                  {categoryError && (
                    <p role="alert" className="mt-2 text-sm text-destructive">
                      {categoryError}
                    </p>
                  )}
                  {categorySuccess && (
                    <p role="status" className="mt-2 text-sm text-muted-foreground">
                      {categorySuccess}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="product-image">URL εικόνας (προαιρετικό)</FieldLabel>
                <Input
                  id="product-image"
                  type="url"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                />
              </div>
              <div>
                <FieldLabel htmlFor="product-dimensions">Διαστάσεις</FieldLabel>
                <Input
                  id="product-dimensions"
                  placeholder="π.χ. 12 × 8 × 6 cm"
                  value={form.dimensions}
                  onChange={(event) => setForm({ ...form, dimensions: event.target.value })}
                  maxLength={500}
                />
              </div>
              <div>
                <FieldLabel htmlFor="product-weight">Βάρος (g)</FieldLabel>
                <Input
                  id="product-weight"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="π.χ. 350"
                  value={form.weightGrams}
                  onChange={(event) => setForm({ ...form, weightGrams: event.target.value })}
                />
              </div>
              <div>
                <FieldLabel htmlFor="product-care">Οδηγίες φροντίδας</FieldLabel>
                <Textarea
                  id="product-care"
                  value={form.care}
                  onChange={(event) => setForm({ ...form, care: event.target.value })}
                  maxLength={2000}
                  rows={4}
                />
              </div>
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Χαρακτηριστικά κεραμικού</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    id="product-glazed"
                    type="checkbox"
                    checked={form.glazed}
                    onChange={(event) => setForm({ ...form, glazed: event.target.checked })}
                    className="size-4 accent-primary"
                  />
                  Υαλωμένο
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    id="product-fired"
                    type="checkbox"
                    checked={form.fired}
                    onChange={(event) => setForm({ ...form, fired: event.target.checked })}
                    className="size-4 accent-primary"
                  />
                  Ψημένο
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    id="product-home-use"
                    type="checkbox"
                    checked={form.homeUse}
                    onChange={(event) => setForm({ ...form, homeUse: event.target.checked })}
                    className="size-4 accent-primary"
                  />
                  Κατάλληλο για οικιακή χρήση
                </label>
              </fieldset>
              <div>
                <FieldLabel htmlFor="product-sku">Μοναδικός κωδικός SKU</FieldLabel>
                <Input id="product-sku" value={sku} readOnly className="font-mono" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Ο κωδικός αποθηκεύεται μαζί με το προϊόν και είναι μοναδικός στη βάση.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
                  className="size-4 accent-primary"
                />
                Δημοσίευση στον δημόσιο κατάλογο
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              {success && (
                <p
                  role="status"
                  className="rounded-md border border-accent/40 bg-accent/10 p-3 text-sm"
                >
                  {success}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Αποθήκευση..."
                  ) : editingProductId ? (
                    "Αποθήκευση αλλαγών"
                  ) : (
                    <>
                      <Plus className="size-4" />
                      Προσθήκη προϊόντος
                    </>
                  )}
                </Button>
                {editingProductId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Ακύρωση
                  </Button>
                )}
              </div>
            </form>
          </section>

          <section>
            <h2 className="font-display text-2xl">Κατάλογος Supabase ({products.data.length})</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Τα δημοσιευμένα προϊόντα εμφανίζονται στην αρχική σελίδα.
            </p>
            {products.data.length ? (
              <ul className="mt-5 divide-y divide-border rounded-lg border border-border bg-card">
                {products.data.map((product) => (
                  <li key={product.id} className="flex items-center gap-4 p-4">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="size-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-16 rounded-md bg-muted" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{product.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPrice(product.price.amount, product.price.currencyCode)} ·{" "}
                        {product.isPublished ? "Δημοσιευμένο" : "Πρόχειρο"}
                      </p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => editProduct(product)}
                        aria-label={`Επεξεργασία ${product.title}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void removeProduct(product)}
                        aria-label={`Διαγραφή ${product.title}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">Δεν υπάρχουν προϊόντα ακόμη.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
