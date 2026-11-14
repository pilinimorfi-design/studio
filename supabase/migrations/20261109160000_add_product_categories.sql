CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX product_categories_name_unique
  ON public.product_categories (lower(btrim(name)));

INSERT INTO public.product_categories (name)
VALUES
  ('Μπολ'),
  ('Πιάτο'),
  ('Κούπα'),
  ('Βάζο'),
  ('Γλάστρα'),
  ('Ρεσό'),
  ('Τασάκι')
ON CONFLICT DO NOTHING;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_categories FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO service_role;

ALTER TABLE public.products
  ADD COLUMN category_id UUID
  REFERENCES public.product_categories (id) ON DELETE RESTRICT;
