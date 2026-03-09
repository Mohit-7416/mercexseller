
CREATE TABLE public.order_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'seller' CHECK (sender_type IN ('seller', 'buyer')),
  sender_id uuid REFERENCES auth.users(id),
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their shop orders"
ON public.order_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN shops s ON s.id = o.shop_id
    WHERE o.id = order_messages.order_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages for their shop orders"
ON public.order_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN shops s ON s.id = o.shop_id
    WHERE o.id = order_messages.order_id AND s.owner_id = auth.uid()
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
