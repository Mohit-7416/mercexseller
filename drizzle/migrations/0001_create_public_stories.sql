CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  shop_name TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);
GRANT SELECT ON public.stories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active stories" ON public.stories FOR SELECT TO anon, authenticated USING (expires_at > now() OR owner_id = auth.uid());
CREATE POLICY "Shop owners can create stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));
CREATE POLICY "Shop owners can update their stories" ON public.stories FOR UPDATE TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid())) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));
CREATE POLICY "Shop owners can delete their stories" ON public.stories FOR DELETE TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));

CREATE TABLE public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (story_id, viewer_id)
);
GRANT SELECT, INSERT, DELETE ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Story owners and viewers can read views" ON public.story_views FOR SELECT TO authenticated USING (viewer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.owner_id = auth.uid()));
CREATE POLICY "Signed-in viewers can mark stories seen" ON public.story_views FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.expires_at > now() AND s.owner_id <> auth.uid()));
CREATE POLICY "Viewers can remove their own story views" ON public.story_views FOR DELETE TO authenticated USING (viewer_id = auth.uid());

CREATE TABLE public.story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_reactions TO authenticated;
GRANT ALL ON public.story_reactions TO service_role;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Story owners and reactors can read reactions" ON public.story_reactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.owner_id = auth.uid()));
CREATE POLICY "Signed-in viewers can react to active stories" ON public.story_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.expires_at > now() AND s.owner_id <> auth.uid()));
CREATE POLICY "Viewers can update their own reactions" ON public.story_reactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.expires_at > now()));
CREATE POLICY "Viewers can remove their own reactions" ON public.story_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_story_metrics(_story_id UUID)
RETURNS TABLE (view_count BIGINT, reactions JSONB)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.story_views v WHERE v.story_id = _story_id),
    COALESCE((SELECT jsonb_object_agg(r.emoji, r.total) FROM (SELECT emoji, count(*) AS total FROM public.story_reactions WHERE story_id = _story_id GROUP BY emoji) r), '{}'::jsonb)
  WHERE EXISTS (SELECT 1 FROM public.stories s WHERE s.id = _story_id AND (s.expires_at > now() OR s.owner_id = auth.uid()));
$$;
GRANT EXECUTE ON FUNCTION public.get_story_metrics(UUID) TO anon, authenticated;