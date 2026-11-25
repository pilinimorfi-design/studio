import { useState, useRef, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";

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
import { supabase } from "@/integrations/supabase/client";
import {
  createManagedProductCategory,
  createManagedProduct,
  createProductSku,
  DEFAULT_CARE_INSTRUCTIONS,
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
  stock: "1",
  categoryId: "",
  imageUrl: "",
  heightCm: "",
  lengthCm: "",
  widthCm: "",
  weightGrams: "",
  care: DEFAULT_CARE_INSTRUCTIONS,
  glazed: false,
  homeUse: false,
  fired: false,
  isPublished: true,
});

const greekTransliteration: Record<string, string> = {
  α: "a",
  β: "v",
  γ: "g",
  δ: "d",
  ε: "e",
  ζ: "z",
  η: "i",
  θ: "th",
  ι: "i",
  κ: "k",
  λ: "l",
  μ: "m",
  ν: "n",
  ξ: "x",
  ο: "o",
  π: "p",
  ρ: "r",
  σ: "s",
  ς: "s",
  τ: "t",
  υ: "y",
  φ: "f",
  χ: "ch",
  ψ: "ps",
  ω: "o",
};

const KNOWN_CATEGORY_SLUGS: Record<string, string> = {
  βαζα: "baza",
  βαζο: "baza",
  κουπες: "cups",
  κουπα: "cups",
  γλαστρες: "glastres",
  γλαστρα: "glastres",
  μπολ: "mpol",
  πιατα: "piata",
  πιατο: "piata",
  τασακια: "tasakia",
  τασακι: "tasakia",
  ρεσο: "reso",
  θηκες: "thikes",
  θηκη: "thikes",
};

function categoryToSlug(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (KNOWN_CATEGORY_SLUGS[normalized]) {
    return KNOWN_CATEGORY_SLUGS[normalized];
  }

  return (
    normalized
      .replace(/[α-ως]/g, (char) => greekTransliteration[char] ?? char)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "general"
  );
}

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      stock: String(product.stock),
      categoryId,
      imageUrl: product.imageUrl ?? "",
      heightCm:
        product.heightCm === null || product.heightCm === undefined ? "" : String(product.heightCm),
      lengthCm:
        product.lengthCm === null || product.lengthCm === undefined ? "" : String(product.lengthCm),
      widthCm:
        product.widthCm === null || product.widthCm === undefined ? "" : String(product.widthCm),
      weightGrams: product.weightGrams === null ? "" : String(product.weightGrams),
      care: product.care ?? DEFAULT_CARE_INSTRUCTIONS,
      glazed: product.glazed ?? false,
      homeUse: product.homeUse ?? false,
      fired: product.fired ?? false,
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
          Διαχειριση καταστηματος
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
              {/* 1. Κατηγορία */}
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

              {/* 2. Φωτογραφία */}
              <div>
                <FieldLabel htmlFor="product-image">Φωτογραφία (προαιρετικό)</FieldLabel>
                <div className="mt-1 flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Upload className="size-4 shrink-0" />
                    {isUploading ? "Μεταφόρτωση..." : "Επιλέξτε αρχείο εικόνας"}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadError("");

                        if (!form.categoryId) {
                          setUploadError(
                            "Επιλέξτε πρώτα κατηγορία προϊόντος πριν ανεβάσετε φωτογραφία.",
                          );
                          if (fileInputRef.current) fileInputRef.current.value = "";
                          return;
                        }

                        setIsUploading(true);
                        try {
                          const selectedCat = categories.data?.find(
                            (c) => c.id === form.categoryId,
                          );
                          const categorySlug = selectedCat
                            ? categoryToSlug(selectedCat.name)
                            : "general";
                          const ext = file.name.split(".").pop() ?? "jpg";
                          const path = `${categorySlug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

                          // Upload to 'images' bucket (with fallback to 'product-images' if needed)
                          let bucketName = "images";
                          let { error: uploadErr } = await supabase.storage
                            .from(bucketName)
                            .upload(path, file, { upsert: false });

                          if (
                            uploadErr &&
                            (uploadErr.message?.includes("Bucket not found") ||
                              (uploadErr as { statusCode?: string }).statusCode === "404")
                          ) {
                            bucketName = "product-images";
                            const fallbackResult = await supabase.storage
                              .from(bucketName)
                              .upload(path, file, { upsert: false });
                            uploadErr = fallbackResult.error;
                          }

                          if (uploadErr) throw uploadErr;

                          const { data: urlData } = supabase.storage
                            .from(bucketName)
                            .getPublicUrl(path);

                          setForm((f) => ({ ...f, imageUrl: urlData.publicUrl }));
                        } catch (err) {
                          setUploadError(
                            err instanceof Error ? err.message : "Η μεταφόρτωση απέτυχε.",
                          );
                        } finally {
                          setIsUploading(false);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }
                      }}
                    />
                  </label>
                  {uploadError && (
                    <p role="alert" className="text-sm text-destructive">
                      {uploadError}
                    </p>
                  )}
                  <Input
                    id="product-image"
                    type="url"
                    placeholder="https://... (ή χρησιμοποιήστε το upload παραπάνω)"
                    value={form.imageUrl}
                    onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                  />
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="Προεπισκόπηση"
                      className="mt-1 h-28 w-28 rounded-md object-cover border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
              </div>

              {/* 3. Τίτλος */}
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

              {/* 4. Περιγραφή */}
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

              {/* 5. Τιμή & Απόθεμα */}
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
                  <FieldLabel htmlFor="product-stock">Απόθεμα (τεμάχια)</FieldLabel>
                  <Input
                    id="product-stock"
                    type="number"
                    min="0"
                    max="999999"
                    step="1"
                    value={form.stock}
                    onChange={(event) => setForm({ ...form, stock: event.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 6. Διαστάσεις */}
              <fieldset>
                <legend className="mb-1.5 block text-sm font-medium">Διαστάσεις (cm)</legend>
                <p className="mb-3 text-xs text-muted-foreground">
                  Καταχωρίστε τις πραγματικές διαστάσεις του προϊόντος (επιτρέπονται και δεκαδικά,
                  π.χ. 1.1). Για τη συσκευασία αποστολής προστίθεται αυτόματα +1 cm σε κάθε
                  διάσταση.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <FieldLabel htmlFor="product-height">Ύψος</FieldLabel>
                    <Input
                      id="product-height"
                      type="number"
                      min="0.01"
                      max="500"
                      step="0.01"
                      required
                      value={form.heightCm}
                      onChange={(event) => setForm({ ...form, heightCm: event.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="product-length">Μήκος</FieldLabel>
                    <Input
                      id="product-length"
                      type="number"
                      min="0.01"
                      max="500"
                      step="0.01"
                      required
                      value={form.lengthCm}
                      onChange={(event) => setForm({ ...form, lengthCm: event.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="product-width">Πλάτος</FieldLabel>
                    <Input
                      id="product-width"
                      type="number"
                      min="0.01"
                      max="500"
                      step="0.01"
                      required
                      value={form.widthCm}
                      onChange={(event) => setForm({ ...form, widthCm: event.target.value })}
                    />
                  </div>
                </div>
              </fieldset>

              {/* 7. Βάρος */}
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

              {/* 8. Χαρακτηριστικά κεραμικού */}
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
                    id="product-home-use"
                    type="checkbox"
                    checked={form.homeUse}
                    onChange={(event) => setForm({ ...form, homeUse: event.target.checked })}
                    className="size-4 accent-primary"
                  />
                  Κατάλληλο για οικιακή χρήση
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    id="product-fired"
                    type="checkbox"
                    checked={form.fired}
                    onChange={(event) => setForm({ ...form, fired: event.target.checked })}
                    className="size-4 accent-primary"
                  />
                  Πυρίμαχο
                </label>
              </fieldset>

              {/* 9. SKU */}
              <div>
                <FieldLabel htmlFor="product-sku">Μοναδικός κωδικός προϊόντος (SKU)</FieldLabel>
                <Input id="product-sku" value={sku} readOnly className="font-mono" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Δημιουργείται αυτόματα και είναι μοναδικός για κάθε προϊόν.
                </p>
              </div>

              {/* 10. Δημοσίευση */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
                  className="size-4 accent-primary"
                />
                Δημοσίευση στον δημόσιο κατάλογο
              </label>

              {/* 11. Οδηγίες φροντίδας */}
              <div>
                <FieldLabel htmlFor="product-care">Οδηγίες φροντίδας</FieldLabel>
                <Textarea
                  id="product-care"
                  value={form.care}
                  placeholder={DEFAULT_CARE_INSTRUCTIONS}
                  onChange={(event) => setForm({ ...form, care: event.target.value })}
                  maxLength={2000}
                  rows={4}
                />
              </div>

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
                        {product.isPublished ? "Δημοσιευμένο" : "Πρόχειρο"} · Απόθεμα:{" "}
                        {product.stock}
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
