ALTER TABLE public.device_reviews ADD COLUMN IF NOT EXISTS ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_device_reviews_ip_hash ON public.device_reviews(ip_hash);
