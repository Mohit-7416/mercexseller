REVOKE EXECUTE ON FUNCTION public.create_seller_notification(uuid, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_seller_new_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_seller_new_bid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_seller_order_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_seller_new_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_seller_story_reply() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_seller_story_reaction() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_seller_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  shop_owner uuid;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO shop_owner FROM public.shops WHERE id = NEW.shop_id;

  PERFORM public.create_seller_notification(
    shop_owner,
    'order',
    'Order status updated',
    'Order ' || NEW.order_number || ' is now ' || replace(NEW.status::text, '_', ' '),
    '/dashboard/orders',
    NEW.id
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_seller_order_status_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER seller_notification_order_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_order_status_change();