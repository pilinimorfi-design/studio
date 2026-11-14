ALTER TABLE public.products
  ADD COLUMN weight_grams NUMERIC(10, 2)
  CHECK (weight_grams IS NULL OR weight_grams >= 0);
