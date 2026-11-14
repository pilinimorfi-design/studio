CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_token_hash TEXT NOT NULL CHECK (cart_token_hash ~ '^[0-9a-f]{64}$'),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_token_hash, product_id)
);

CREATE INDEX cart_items_token_idx ON public.cart_items (cart_token_hash);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  boxnow_locker_id TEXT NOT NULL,
  boxnow_locker_name TEXT NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_amount NUMERIC(12, 2) CHECK (shipping_amount IS NULL OR shipping_amount >= 0),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'payment_failed', 'cancelled', 'processing', 'shipped')),
  payment_provider TEXT NOT NULL DEFAULT 'easypay' CHECK (payment_provider = 'easypay'),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'refunded')),
  payment_reference TEXT,
  payment_url TEXT,
  boxnow_shipment_id TEXT,
  boxnow_tracking_number TEXT,
  boxnow_label_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX order_items_order_id_idx ON public.order_items (order_id);
CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.cart_items, public.orders, public.order_items FROM anon, authenticated;
GRANT ALL ON public.cart_items, public.orders, public.order_items TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.orders_order_number_seq TO service_role;

CREATE FUNCTION public.add_cart_item(
  p_cart_token_hash TEXT,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_cart_token_hash !~ '^[0-9a-f]{64}$' OR p_quantity NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Invalid cart input';
  END IF;

  INSERT INTO public.cart_items (cart_token_hash, product_id, quantity)
  SELECT p_cart_token_hash, product.id, p_quantity
  FROM public.products AS product
  WHERE product.id = p_product_id AND product.is_published = TRUE
  ON CONFLICT (cart_token_hash, product_id)
  DO UPDATE SET
    quantity = LEAST(public.cart_items.quantity + EXCLUDED.quantity, 20),
    updated_at = now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product is unavailable';
  END IF;
END;
$$;

CREATE FUNCTION public.create_guest_order(
  p_cart_token_hash TEXT,
  p_customer_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_boxnow_locker_id TEXT,
  p_boxnow_locker_name TEXT,
  p_shipping_amount NUMERIC
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
  IF p_cart_token_hash !~ '^[0-9a-f]{64}$'
    OR char_length(trim(p_customer_name)) NOT BETWEEN 2 AND 150
    OR char_length(trim(p_email)) NOT BETWEEN 3 AND 254
    OR char_length(trim(p_phone)) NOT BETWEEN 7 AND 32
    OR char_length(trim(p_boxnow_locker_id)) NOT BETWEEN 1 AND 100
    OR char_length(trim(p_boxnow_locker_name)) NOT BETWEEN 1 AND 300
    OR p_shipping_amount IS NULL
    OR p_shipping_amount < 0 THEN
    RAISE EXCEPTION 'Invalid order input';
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
    subtotal, shipping_amount, total_amount
  )
  VALUES (
    trim(p_customer_name), lower(trim(p_email)), trim(p_phone),
    trim(p_boxnow_locker_id), trim(p_boxnow_locker_name),
    v_subtotal, p_shipping_amount, v_subtotal + p_shipping_amount
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

REVOKE ALL ON FUNCTION public.add_cart_item(TEXT, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_cart_item(TEXT, UUID, INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.create_guest_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_guest_order(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) TO service_role;
