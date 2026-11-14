CREATE TABLE public.story_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.story_replies TO authenticated;
GRANT ALL ON public.story_replies TO service_role;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Story owners and reply senders can read replies" ON public.story_replies FOR SELECT TO authenticated USING (sender_id = auth.uid() OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.owner_id = auth.uid()));
CREATE POLICY "Signed-in viewers can reply to active stories" ON public.story_replies FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.expires_at > now() AND s.owner_id <> auth.uid()));
CREATE POLICY "Reply senders can delete their own replies" ON public.story_replies FOR DELETE TO authenticated USING (sender_id = auth.uid());