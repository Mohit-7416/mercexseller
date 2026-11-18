REVOKE ALL ON public.seller_notifications FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, TRUNCATE, REFERENCES, TRIGGER ON public.seller_notifications FROM authenticated;
GRANT SELECT, DELETE ON public.seller_notifications TO authenticated;
GRANT UPDATE (read_at) ON public.seller_notifications TO authenticated;
GRANT ALL ON public.seller_notifications TO service_role;