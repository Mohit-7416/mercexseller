CREATE TABLE public.seller_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('order', 'bid', 'order_message', 'review', 'story_reply', 'story_reaction')),
  title text NOT NULL,
  message text NOT NULL,
  target_path text NOT NULL,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

GRANT SELECT, UPDATE, DELETE ON public.seller_notifications TO authenticated;
GRANT ALL ON public.seller_notifications TO service_role;

ALTER TABLE public.seller_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can read their notifications"
ON public.seller_notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Sellers can mark their notifications read"
ON public.seller_notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sellers can delete their notifications"
ON public.seller_notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE INDEX seller_notifications_user_created_idx
ON public.seller_notifications (user_id, created_at DESC);

CREATE INDEX seller_notifications_unread_idx
ON public.seller_notifications (user_id, created_at DESC)
WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.create_seller_notification(
  _user_id uuid,
  _type text,
  _title text,
  _message text,
  _target_path text,
  _entity_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.seller_notifications (user_id, type, title, message, target_path, entity_id)
  SELECT _user_id, _type, _title, _message, _target_path, _entity_id
  WHERE _user_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.notify_seller_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  shop_owner uuid;
BEGIN
  SELECT owner_id INTO shop_owner FROM public.shops WHERE id = NEW.shop_id;
  PERFORM public.create_seller_notification(
    shop_owner,
    'order',
    'New order received',
    'Order ' || NEW.order_number || ' from ' || COALESCE(NEW.buyer_name, 'a customer') || ' — ₹' || NEW.total::text,
    '/dashboard/orders',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_notification_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_new_order();

CREATE OR REPLACE FUNCTION public.notify_seller_new_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  shop_owner uuid;
  listing_title text;
  bidder_name text;
BEGIN
  SELECT s.owner_id, l.title INTO shop_owner, listing_title
  FROM public.listings l
  JOIN public.shops s ON s.id = l.shop_id
  WHERE l.id = NEW.listing_id;

  SELECT full_name INTO bidder_name FROM public.profiles WHERE id = NEW.bidder_id;

  PERFORM public.create_seller_notification(
    shop_owner,
    'bid',
    'New auction bid',
    COALESCE(bidder_name, 'A buyer') || ' bid ₹' || NEW.amount::text || ' on ' || COALESCE(listing_title, 'your listing'),
    '/dashboard',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_notification_new_bid
AFTER INSERT ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_new_bid();

CREATE OR REPLACE FUNCTION public.notify_seller_order_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  shop_owner uuid;
BEGIN
  IF NEW.sender_type <> 'buyer' THEN
    RETURN NEW;
  END IF;

  SELECT s.owner_id INTO shop_owner
  FROM public.orders o
  JOIN public.shops s ON s.id = o.shop_id
  WHERE o.id = NEW.order_id;

  PERFORM public.create_seller_notification(
    shop_owner,
    'order_message',
    'New customer message',
    left(NEW.message, 160),
    '/dashboard/orders/chat?orderId=' || NEW.order_id::text,
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_notification_order_message
AFTER INSERT ON public.order_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_order_message();

CREATE OR REPLACE FUNCTION public.notify_seller_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer_name text;
BEGIN
  SELECT full_name INTO buyer_name FROM public.profiles WHERE id = NEW.buyer_id;
  PERFORM public.create_seller_notification(
    NEW.seller_id,
    'review',
    'New buyer review',
    COALESCE(buyer_name, 'A buyer') || ' left a ' || NEW.rating::text || '-star review' || CASE WHEN NEW.comment IS NOT NULL AND NEW.comment <> '' THEN ': ' || left(NEW.comment, 120) ELSE '' END,
    '/dashboard/reviews',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_notification_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_new_review();

CREATE OR REPLACE FUNCTION public.notify_seller_story_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  story_owner uuid;
BEGIN
  SELECT owner_id INTO story_owner FROM public.stories WHERE id = NEW.story_id;
  IF story_owner = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.create_seller_notification(
    story_owner,
    'story_reply',
    'New Story reply',
    left(NEW.message, 160),
    '/dashboard',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_notification_story_reply
AFTER INSERT ON public.story_replies
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_story_reply();

CREATE OR REPLACE FUNCTION public.notify_seller_story_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  story_owner uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.emoji IS NOT DISTINCT FROM OLD.emoji THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO story_owner FROM public.stories WHERE id = NEW.story_id;
  IF story_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.create_seller_notification(
    story_owner,
    'story_reaction',
    'New Story reaction',
    NEW.emoji || ' reaction to your Story',
    '/dashboard',
    NEW.story_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_notification_story_reaction
AFTER INSERT OR UPDATE ON public.story_reactions
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_story_reaction();

ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_notifications;