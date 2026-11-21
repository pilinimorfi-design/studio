CREATE TABLE public.device_reviews (
  device_id TEXT PRIMARY KEY,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.device_reviews TO anon;
GRANT ALL ON public.device_reviews TO service_role;

ALTER TABLE public.device_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a device review"
ON public.device_reviews
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anyone can update a device review"
ON public.device_reviews
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can read device reviews"
ON public.device_reviews
FOR SELECT
TO anon
USING (true);

CREATE OR REPLACE FUNCTION public.upsert_device_review(p_device_id TEXT, p_rating INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.device_reviews (device_id, rating, created_at)
  VALUES (p_device_id, p_rating, now())
  ON CONFLICT (device_id) DO UPDATE
  SET rating = EXCLUDED.rating,
      created_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_device_review(TEXT, INTEGER) TO anon;

CREATE OR REPLACE FUNCTION public.get_device_review_summary()
RETURNS TABLE (average_rating NUMERIC, review_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    round(avg(rating)::numeric, 2) AS average_rating,
    count(*) AS review_count
  FROM public.device_reviews;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_device_review_summary() TO anon;
