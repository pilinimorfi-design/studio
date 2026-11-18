ALTER TABLE public.special_order_inquiries
  DROP CONSTRAINT IF EXISTS special_order_inquiries_technical_details_check;

ALTER TABLE public.special_order_inquiries
  ADD CONSTRAINT special_order_inquiries_technical_details_check
  CHECK (char_length(btrim(technical_details)) BETWEEN 0 AND 3000);
