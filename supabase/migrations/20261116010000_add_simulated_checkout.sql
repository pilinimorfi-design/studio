ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS shipping_method TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city TEXT,
  ADD COLUMN IF NOT EXISTS shipping_county TEXT,
  ADD COLUMN IF NOT EXISTS shipping_notes TEXT;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_provider_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_provider_check
    CHECK (payment_provider IN ('easypay', 'simulation'));

CREATE OR REPLACE FUNCTION public.create_simulated_guest_order(
  p_cart_token_hash TEXT,
  p_customer_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_shipping_method TEXT,
  p_locker_id TEXT,
  p_locker_name TEXT,
  p_shipping_address TEXT,
  p_shipping_postal_code TEXT,
  p_shipping_city TEXT,
  p_shipping_county TEXT,
  p_shipping_notes TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id UUID;
  v_subtotal NUMERIC(12, 2);
BEGIN
  IF p_cart_token_hash IS NULL
    OR p_cart_token_hash !~ '^[0-9a-f]{64}$'
    OR p_customer_name IS NULL
    OR char_length(trim(p_customer_name)) NOT BETWEEN 2 AND 150
    OR p_email IS NULL
    OR char_length(trim(p_email)) NOT BETWEEN 3 AND 254
    OR p_phone IS NULL
    OR char_length(trim(p_phone)) NOT BETWEEN 7 AND 32
    OR p_shipping_method IS NULL
    OR p_shipping_method NOT IN ('boxnow', 'acs')
    OR (p_shipping_method = 'boxnow' AND (
      p_locker_id IS NULL
      OR p_locker_name IS NULL
      OR char_length(trim(p_locker_id)) NOT BETWEEN 1 AND 100
      OR char_length(trim(p_locker_name)) NOT BETWEEN 1 AND 300
    ))
    OR (p_shipping_method = 'acs' AND (
      p_shipping_address IS NULL
      OR p_shipping_postal_code IS NULL
      OR p_shipping_city IS NULL
      OR char_length(trim(p_shipping_address)) NOT BETWEEN 3 AND 300
      OR p_shipping_postal_code !~ '^[0-9]{5}$'
      OR char_length(trim(p_shipping_city)) NOT BETWEEN 2 AND 150
    ))
    OR char_length(COALESCE(p_shipping_county, '')) > 150
    OR char_length(COALESCE(p_shipping_notes, '')) > 1000 THEN
    RAISE EXCEPTION 'Invalid simulated order input';
  END IF;

  SELECT COALESCE(SUM(product.price * cart.quantity), 0)
    INTO v_subtotal
  FROM public.cart_items AS cart
  JOIN public.products AS product ON product.id = cart.product_id
  WHERE cart.cart_token_hash = p_cart_token_hash
    AND product.is_published = TRUE;

  IF v_subtotal <= 0 THEN
    RAISE EXCEPTION 'Cart is empty or unavailable';
  END IF;

  INSERT INTO public.orders (
    customer_name, email, phone, boxnow_locker_id, boxnow_locker_name,
    subtotal, shipping_amount, total_amount, status, payment_provider,
    payment_status, is_test, shipping_method, shipping_address,
    shipping_postal_code, shipping_city, shipping_county, shipping_notes
  )
  VALUES (
    trim(p_customer_name), lower(trim(p_email)), trim(p_phone),
    COALESCE(NULLIF(trim(p_locker_id), ''), 'SIMULATED'),
    COALESCE(NULLIF(trim(p_locker_name), ''), 'Δεν εφαρμόζεται'),
    v_subtotal, 0, v_subtotal, 'pending_payment', 'simulation',
    'pending', TRUE, p_shipping_method,
    NULLIF(trim(p_shipping_address), ''),
    NULLIF(trim(p_shipping_postal_code), ''),
    NULLIF(trim(p_shipping_city), ''),
    NULLIF(trim(p_shipping_county), ''),
    NULLIF(trim(p_shipping_notes), '')
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, sku, title, unit_price, quantity, image_url)
  SELECT v_order_id, product.id, product.sku, product.title, product.price, cart.quantity, product.image_url
  FROM public.cart_items AS cart
  JOIN public.products AS product ON product.id = cart.product_id
  WHERE cart.cart_token_hash = p_cart_token_hash
    AND product.is_published = TRUE;

  DELETE FROM public.cart_items WHERE cart_token_hash = p_cart_token_hash;
  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_simulated_guest_order(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_simulated_guest_order(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;

CREATE OR REPLACE FUNCTION public.get_order_review_summary()
RETURNS TABLE (average_rating NUMERIC, review_count BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT ROUND(AVG(review.rating)::NUMERIC, 1), COUNT(*)
  FROM public.order_reviews AS review
  JOIN public.orders AS customer_order ON customer_order.id = review.order_id
  WHERE customer_order.is_test = FALSE;
$$;

REVOKE ALL ON FUNCTION public.get_order_review_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_review_summary() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
