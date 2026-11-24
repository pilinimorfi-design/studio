-- Migration: Allow anon management for product-images bucket, products and product_categories
-- 1. Ensure bucket 'product-images' exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage RLS policies on storage.objects for 'product-images'
CREATE POLICY "Allow public select on product-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Allow public insert on product-images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public update on product-images"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public delete on product-images"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'product-images');

-- 3. Grants and policies on public.products
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;

DROP POLICY IF EXISTS "Allow anon all on products" ON public.products;
CREATE POLICY "Allow anon all on products"
  ON public.products
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Grants and policies on public.product_categories
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO anon, authenticated;

DROP POLICY IF EXISTS "Allow anon all on product_categories" ON public.product_categories;
CREATE POLICY "Allow anon all on product_categories"
  ON public.product_categories
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
