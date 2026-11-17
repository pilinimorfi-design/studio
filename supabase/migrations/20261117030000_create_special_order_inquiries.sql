CREATE TABLE public.special_order_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 150),
  phone TEXT NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
  email TEXT NOT NULL CHECK (char_length(btrim(email)) BETWEEN 3 AND 254),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 999999),
  technical_details TEXT NOT NULL CHECK (char_length(btrim(technical_details)) BETWEEN 10 AND 3000),
  delivery_window TEXT NOT NULL CHECK (char_length(btrim(delivery_window)) BETWEEN 2 AND 150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.special_order_inquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.special_order_inquiries FROM anon, authenticated;
GRANT ALL ON public.special_order_inquiries TO service_role;
