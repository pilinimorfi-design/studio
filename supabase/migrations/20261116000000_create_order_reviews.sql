CREATE TABLE public.order_reviews (
  order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_reviews FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.order_reviews TO service_role;

CREATE FUNCTION public.get_order_review_summary()
RETURNS TABLE (average_rating NUMERIC, review_count BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT ROUND(AVG(review.rating)::NUMERIC, 1), COUNT(*)
  FROM public.order_reviews AS review;
$$;

REVOKE ALL ON FUNCTION public.get_order_review_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_review_summary() TO anon, authenticated;
