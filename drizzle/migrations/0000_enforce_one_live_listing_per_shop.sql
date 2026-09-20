CREATE UNIQUE INDEX one_live_listing_per_shop
ON public.listings (shop_id)
WHERE status = 'live';