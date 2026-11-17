ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS length_cm NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS width_cm NUMERIC(8, 2);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_shipping_dimensions_positive;

ALTER TABLE public.products
  ADD CONSTRAINT products_shipping_dimensions_positive
  CHECK (
    (height_cm IS NULL OR height_cm BETWEEN 0.01 AND 500)
    AND (length_cm IS NULL OR length_cm BETWEEN 0.01 AND 500)
    AND (width_cm IS NULL OR width_cm BETWEEN 0.01 AND 500)
  );

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_packages JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.create_simulated_guest_order_with_locker(
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
  p_shipping_notes TEXT,
  p_locker_address TEXT,
  p_locker_postal_code TEXT,
  p_shipping_amount NUMERIC,
  p_shipping_packages JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id UUID;
  v_package JSONB;
  v_items JSONB;
  v_size TEXT;
  v_volume NUMERIC;
  v_expected_shipping NUMERIC := 0;
  v_package_count INTEGER := 0;
BEGIN
  IF p_shipping_amount IS NULL OR p_shipping_amount < 0
    OR jsonb_typeof(p_shipping_packages) <> 'array'
    OR jsonb_array_length(p_shipping_packages) = 0 THEN
    RAISE EXCEPTION 'Invalid shipping quote';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.cart_items AS cart
    LEFT JOIN (
      SELECT
        (item->>'productId')::UUID AS product_id,
        SUM((item->>'quantity')::INTEGER) AS quantity
      FROM jsonb_array_elements(p_shipping_packages) AS package(value)
      CROSS JOIN LATERAL jsonb_array_elements(package.value->'items') AS line(item)
      GROUP BY (item->>'productId')::UUID
    ) AS allocation ON allocation.product_id = cart.product_id
    WHERE cart.cart_token_hash = p_cart_token_hash
      AND allocation.quantity IS DISTINCT FROM cart.quantity
  ) OR EXISTS (
    SELECT 1
    FROM (
      SELECT (item->>'productId')::UUID AS product_id
      FROM jsonb_array_elements(p_shipping_packages) AS package(value)
      CROSS JOIN LATERAL jsonb_array_elements(package.value->'items') AS line(item)
      GROUP BY (item->>'productId')::UUID
    ) AS allocation
    LEFT JOIN public.cart_items AS cart
      ON cart.product_id = allocation.product_id
      AND cart.cart_token_hash = p_cart_token_hash
    WHERE cart.product_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Shipping package items do not match the cart';
  END IF;

  FOR v_package IN SELECT value FROM jsonb_array_elements(p_shipping_packages)
  LOOP
    v_package_count := v_package_count + 1;
    v_size := v_package->>'size';
    v_items := v_package->'items';

    IF jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
      RAISE EXCEPTION 'Shipping package is empty';
    END IF;

    IF p_shipping_method = 'boxnow' THEN
      IF v_package->'locker'->>'id' IS NULL OR v_package->'locker'->>'name' IS NULL THEN
        RAISE EXCEPTION 'A BoxNow locker is required for every package';
      END IF;

      SELECT COALESCE(SUM(
        product.height_cm * product.length_cm * product.width_cm *
        (item->>'quantity')::NUMERIC
      ), 0)
      INTO v_volume
      FROM jsonb_array_elements(v_items) AS line(item)
      JOIN public.products AS product ON product.id = (item->>'productId')::UUID
      WHERE product.height_cm IS NOT NULL
        AND product.length_cm IS NOT NULL
        AND product.width_cm IS NOT NULL;

      IF v_size = 'small' AND v_volume <= 8 * 45 * 60 THEN
        v_expected_shipping := v_expected_shipping + 4;
      ELSIF v_size = 'medium' AND v_volume <= 17 * 45 * 60 THEN
        v_expected_shipping := v_expected_shipping + 4;
      ELSIF v_size = 'large' AND v_volume <= 36 * 45 * 60 THEN
        v_expected_shipping := v_expected_shipping + 10;
      ELSE
        RAISE EXCEPTION 'The BoxNow parcel exceeds its size capacity';
      END IF;

      IF abs(v_volume - COALESCE((v_package->>'volumeCm3')::NUMERIC, -1)) > 0.01 THEN
        RAISE EXCEPTION 'The BoxNow parcel volume does not match product dimensions';
      END IF;
    ELSIF p_shipping_method = 'acs' THEN
      IF v_package_count <> 1 OR v_size <> 'acs' THEN
        RAISE EXCEPTION 'ACS shipping currently supports one parcel';
      END IF;
      v_expected_shipping := 12;
    ELSE
      RAISE EXCEPTION 'Invalid shipping method';
    END IF;
  END LOOP;

  IF abs(v_expected_shipping - p_shipping_amount) > 0.01 THEN
    RAISE EXCEPTION 'Shipping amount does not match the selected parcel sizes';
  END IF;

  v_order_id := public.create_simulated_guest_order_with_locker(
    p_cart_token_hash,
    p_customer_name,
    p_email,
    p_phone,
    p_shipping_method,
    p_locker_id,
    p_locker_name,
    p_shipping_address,
    p_shipping_postal_code,
    p_shipping_city,
    p_shipping_county,
    p_shipping_notes,
    p_locker_address,
    p_locker_postal_code
  );

  UPDATE public.orders
  SET shipping_amount = p_shipping_amount,
      total_amount = total_amount + p_shipping_amount,
      shipping_packages = p_shipping_packages
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_simulated_guest_order_with_locker(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_simulated_guest_order_with_locker(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB
) TO service_role;

NOTIFY pgrst, 'reload schema';
