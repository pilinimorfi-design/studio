ALTER TABLE public.special_order_inquiries
  DROP CONSTRAINT IF EXISTS special_order_inquiries_quantity_check;

ALTER TABLE public.special_order_inquiries
  ADD CONSTRAINT special_order_inquiries_quantity_minimum
  CHECK (quantity BETWEEN 20 AND 999999);
