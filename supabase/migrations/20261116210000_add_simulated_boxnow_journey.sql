ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS boxnow_locker_address TEXT,
  ADD COLUMN IF NOT EXISTS boxnow_locker_postal_code TEXT;

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
  p_locker_postal_code TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  IF p_cart_token_hash IS NULL OR p_cart_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Δεν είναι έγκυρο το ενεργό καλάθι';
  END IF;
  IF p_customer_name IS NULL OR char_length(trim(p_customer_name)) NOT BETWEEN 2 AND 150 THEN
    RAISE EXCEPTION 'Το ονοματεπώνυμο πρέπει να έχει 2 έως 150 χαρακτήρες';
  END IF;
  IF p_email IS NULL OR char_length(trim(p_email)) NOT BETWEEN 3 AND 254 THEN
    RAISE EXCEPTION 'Το email πρέπει να έχει έως 254 χαρακτήρες';
  END IF;
  IF p_phone IS NULL OR char_length(trim(p_phone)) NOT BETWEEN 7 AND 32 THEN
    RAISE EXCEPTION 'Το τηλέφωνο πρέπει να έχει 7 έως 32 χαρακτήρες';
  END IF;
  IF p_shipping_method IS NULL OR p_shipping_method NOT IN ('boxnow', 'acs') THEN
    RAISE EXCEPTION 'Δεν είναι έγκυρος ο τρόπος αποστολής';
  END IF;
  IF p_shipping_method = 'boxnow' AND (
    p_locker_id IS NULL
    OR p_locker_name IS NULL
    OR char_length(trim(p_locker_id)) NOT BETWEEN 1 AND 100
    OR char_length(trim(p_locker_name)) NOT BETWEEN 1 AND 300
  ) THEN
    RAISE EXCEPTION 'Επιλέξτε έγκυρη θυρίδα BoxNow';
  END IF;
  IF p_shipping_method = 'acs' AND (
    p_shipping_address IS NULL
    OR p_shipping_postal_code IS NULL
    OR p_shipping_city IS NULL
    OR char_length(trim(p_shipping_address)) NOT BETWEEN 3 AND 300
    OR p_shipping_postal_code !~ '^[0-9]{5}$'
    OR char_length(trim(p_shipping_city)) NOT BETWEEN 2 AND 150
  ) THEN
    RAISE EXCEPTION 'Ελέγξτε τη διεύθυνση, τον Τ.Κ. και την πόλη ACS';
  END IF;
  IF char_length(COALESCE(p_shipping_county, '')) > 150 THEN
    RAISE EXCEPTION 'Το πεδίο νομού πρέπει να έχει έως 150 χαρακτήρες';
  END IF;
  IF char_length(COALESCE(p_shipping_notes, '')) > 1000 THEN
    RAISE EXCEPTION 'Τα σχόλια παράδοσης πρέπει να έχουν έως 1000 χαρακτήρες';
  END IF;
  IF char_length(COALESCE(p_locker_address, '')) > 300
    OR char_length(COALESCE(p_locker_postal_code, '')) > 32 THEN
    RAISE EXCEPTION 'Τα στοιχεία της θυρίδας BoxNow δεν είναι έγκυρα';
  END IF;

  v_order_id := public.create_simulated_guest_order(
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
    p_shipping_notes
  );

  UPDATE public.orders
  SET boxnow_locker_address = NULLIF(trim(p_locker_address), ''),
      boxnow_locker_postal_code = NULLIF(trim(p_locker_postal_code), '')
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_simulated_guest_order_with_locker(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_simulated_guest_order_with_locker(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;

NOTIFY pgrst, 'reload schema';
