-- 1. Ensure 'images' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage policies for 'images'
DROP POLICY IF EXISTS "Public read images" ON storage.objects;
CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  TO public
  USING ( bucket_id = 'images' );

DROP POLICY IF EXISTS "Public upload images" ON storage.objects;
CREATE POLICY "Public upload images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK ( bucket_id = 'images' );

DROP POLICY IF EXISTS "Public update images" ON storage.objects;
CREATE POLICY "Public update images"
  ON storage.objects FOR UPDATE
  TO public
  USING ( bucket_id = 'images' )
  WITH CHECK ( bucket_id = 'images' );

DROP POLICY IF EXISTS "Public delete images" ON storage.objects;
CREATE POLICY "Public delete images"
  ON storage.objects FOR DELETE
  TO public
  USING ( bucket_id = 'images' );

-- 3. Policies & Grants on products
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;

DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products"
  ON public.products FOR SELECT
  TO public
  USING ( true );

DROP POLICY IF EXISTS "Public insert products" ON public.products;
CREATE POLICY "Public insert products"
  ON public.products FOR INSERT
  TO public
  WITH CHECK ( true );

DROP POLICY IF EXISTS "Public update products" ON public.products;
CREATE POLICY "Public update products"
  ON public.products FOR UPDATE
  TO public
  USING ( true )
  WITH CHECK ( true );

DROP POLICY IF EXISTS "Public delete products" ON public.products;
CREATE POLICY "Public delete products"
  ON public.products FOR DELETE
  TO public
  USING ( true );

-- 4. Policies & Grants on product_categories
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO anon, authenticated;

DROP POLICY IF EXISTS "Public read product_categories" ON public.product_categories;
CREATE POLICY "Public read product_categories"
  ON public.product_categories FOR SELECT
  TO public
  USING ( true );

DROP POLICY IF EXISTS "Public insert product_categories" ON public.product_categories;
CREATE POLICY "Public insert product_categories"
  ON public.product_categories FOR INSERT
  TO public
  WITH CHECK ( true );

DROP POLICY IF EXISTS "Public update product_categories" ON public.product_categories;
CREATE POLICY "Public update product_categories"
  ON public.product_categories FOR UPDATE
  TO public
  USING ( true )
  WITH CHECK ( true );

DROP POLICY IF EXISTS "Public delete product_categories" ON public.product_categories;
CREATE POLICY "Public delete product_categories"
  ON public.product_categories FOR DELETE
  TO public
  USING ( true );
