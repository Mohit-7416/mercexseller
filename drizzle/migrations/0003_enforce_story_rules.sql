CREATE OR REPLACE FUNCTION public.validate_story_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    NEW.expires_at := NEW.created_at + interval '24 hours';
  ELSE
    NEW.created_at := OLD.created_at;
    NEW.expires_at := OLD.expires_at;
    NEW.owner_id := OLD.owner_id;
    NEW.shop_id := OLD.shop_id;
    NEW.shop_name := OLD.shop_name;
    NEW.seller_name := OLD.seller_name;
  END IF;
  IF NOT (NEW.media_type LIKE 'image/%' OR NEW.media_type IN ('video/mp4', 'video/webm', 'video/quicktime')) THEN
    RAISE EXCEPTION 'Stories support images, MP4, WebM, or MOV videos.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_story_record_before_write
BEFORE INSERT OR UPDATE ON public.stories
FOR EACH ROW EXECUTE FUNCTION public.validate_story_record();

CREATE OR REPLACE FUNCTION public.validate_story_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.emoji NOT IN ('❤️', '🔥', '👏', '😍') THEN
    RAISE EXCEPTION 'Unsupported story reaction.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_story_reaction_before_write
BEFORE INSERT OR UPDATE ON public.story_reactions
FOR EACH ROW EXECUTE FUNCTION public.validate_story_reaction();

CREATE OR REPLACE FUNCTION public.validate_story_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.message := btrim(NEW.message);
  IF length(NEW.message) < 1 OR length(NEW.message) > 500 THEN
    RAISE EXCEPTION 'Story replies must contain 1 to 500 characters.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_story_reply_before_write
BEFORE INSERT OR UPDATE ON public.story_replies
FOR EACH ROW EXECUTE FUNCTION public.validate_story_reply();