CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE DEFAULT ('PM-' || gen_random_uuid()::TEXT),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 150),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 5000),
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  product_type TEXT NOT NULL DEFAULT '' CHECK (char_length(product_type) <= 100),
  image_url TEXT CHECK (image_url IS NULL OR image_url ~* '^https://'),
  handle TEXT NOT NULL UNIQUE,
  dimensions TEXT,
  care TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_public_catalog_idx
  ON public.products (created_at DESC)
  WHERE is_published = TRUE;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

CREATE POLICY "Anyone can view published products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);
