CREATE OR REPLACE FUNCTION public.add_cart_item(
  p_cart_token_hash TEXT,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stock INTEGER;
  v_cart_quantity INTEGER;
BEGIN
  IF p_cart_token_hash !~ '^[0-9a-f]{64}$' OR p_quantity NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Invalid cart input';
  END IF;

  SELECT product.stock
    INTO v_stock
  FROM public.products AS product
  WHERE product.id = p_product_id AND product.is_published = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Το προϊόν δεν είναι διαθέσιμο.';
  END IF;

  SELECT cart.quantity
    INTO v_cart_quantity
  FROM public.cart_items AS cart
  WHERE cart.cart_token_hash = p_cart_token_hash
    AND cart.product_id = p_product_id;

  IF COALESCE(v_cart_quantity, 0) + p_quantity > LEAST(v_stock, 20) THEN
    RAISE EXCEPTION 'Δεν υπάρχει επαρκές απόθεμα για αυτή την ποσότητα.';
  END IF;

  INSERT INTO public.cart_items (cart_token_hash, product_id, quantity)
  VALUES (p_cart_token_hash, p_product_id, p_quantity)
  ON CONFLICT (cart_token_hash, product_id)
  DO UPDATE SET
    quantity = public.cart_items.quantity + EXCLUDED.quantity,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_cart_item_quantity(
  p_cart_token_hash TEXT,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stock INTEGER;
  v_current_quantity INTEGER;
BEGIN
  IF p_cart_token_hash !~ '^[0-9a-f]{64}$' OR p_quantity NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Invalid cart input';
  END IF;

  SELECT product.stock
    INTO v_stock
  FROM public.products AS product
  WHERE product.id = p_product_id AND product.is_published = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Το προϊόν δεν είναι διαθέσιμο.';
  END IF;

  SELECT cart.quantity
    INTO v_current_quantity
  FROM public.cart_items AS cart
  WHERE cart.cart_token_hash = p_cart_token_hash
    AND cart.product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Το προϊόν δεν βρέθηκε στο καλάθι.';
  END IF;

  IF p_quantity > v_stock AND p_quantity > v_current_quantity THEN
    RAISE EXCEPTION 'Δεν υπάρχει επαρκές απόθεμα για αυτή την ποσότητα.';
  END IF;

  UPDATE public.cart_items
  SET quantity = p_quantity, updated_at = now()
  WHERE cart_token_hash = p_cart_token_hash
    AND product_id = p_product_id;

END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_simulated_order_payment(
  p_order_id UUID,
  p_successful BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item RECORD;
  v_order_id UUID;
BEGIN
  SELECT customer_order.id
    INTO v_order_id
  FROM public.orders AS customer_order
  WHERE customer_order.id = p_order_id
    AND customer_order.is_test = TRUE
    AND customer_order.payment_provider = 'simulation'
    AND customer_order.payment_status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Η δοκιμαστική πληρωμή δεν είναι διαθέσιμη ή έχει ήδη ολοκληρωθεί.';
  END IF;

  IF p_successful THEN
    PERFORM product.id
    FROM public.products AS product
    WHERE product.id IN (
      SELECT order_item.product_id
      FROM public.order_items AS order_item
      WHERE order_item.order_id = p_order_id
        AND order_item.product_id IS NOT NULL
    )
    ORDER BY product.id
    FOR UPDATE;

    FOR v_item IN
      SELECT order_item.product_id, SUM(order_item.quantity)::INTEGER AS quantity
      FROM public.order_items AS order_item
      WHERE order_item.order_id = p_order_id
        AND order_item.product_id IS NOT NULL
      GROUP BY order_item.product_id
      ORDER BY order_item.product_id
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM public.products AS product
        WHERE product.id = v_item.product_id
          AND product.stock >= v_item.quantity
      ) THEN
        RAISE EXCEPTION 'Δεν υπάρχει πλέον επαρκές απόθεμα για την παραγγελία.';
      END IF;
    END LOOP;

    FOR v_item IN
      SELECT order_item.product_id, SUM(order_item.quantity)::INTEGER AS quantity
      FROM public.order_items AS order_item
      WHERE order_item.order_id = p_order_id
        AND order_item.product_id IS NOT NULL
      GROUP BY order_item.product_id
      ORDER BY order_item.product_id
    LOOP
      UPDATE public.products
      SET stock = stock - v_item.quantity,
          updated_at = now()
      WHERE id = v_item.product_id;
    END LOOP;
  END IF;

  UPDATE public.orders
  SET status = CASE WHEN p_successful THEN 'paid' ELSE 'payment_failed' END,
      payment_status = CASE WHEN p_successful THEN 'paid' ELSE 'failed' END,
      updated_at = now()
  WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_cart_item(TEXT, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_cart_item(TEXT, UUID, INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.update_cart_item_quantity(TEXT, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_cart_item_quantity(TEXT, UUID, INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.resolve_simulated_order_payment(UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_simulated_order_payment(UUID, BOOLEAN) TO service_role;

NOTIFY pgrst, 'reload schema';
