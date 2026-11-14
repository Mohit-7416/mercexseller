import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, ChevronLeft, ChevronRight, CirclePlus, Eye, Loader2, MessageCircle, Play, Send, Share2, Trash2, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useShop } from "@/contexts/ShopContext";
import { supabase } from "@/integrations/supabase/client";

type Story = {
  id: string;
  shop_id: string;
  owner_id: string;
  shop_name: string;
  seller_name: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
};

type StoryGroup = { shopId: string; shopName: string; sellerName: string; stories: Story[] };

const REACTIONS = ["❤️", "🔥", "👏", "😍"];
const STORY_DURATION = 7000;
const MAX_MEDIA_SIZE = 50 * 1024 * 1024;

const StoriesExperience = ({ fullPage = false }: { fullPage?: boolean }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { currentShop } = useShop();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [seenStoryIds, setSeenStoryIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [progress, setProgress] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<Array<{ id: string; sender_id: string; message: string; created_at: string }>>([]);
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshStories = useCallback(async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("id, shop_id, owner_id, shop_name, seller_name, media_url, media_type, caption, created_at, expires_at")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Could not load stories:", error);
    } else {
      setStories((data || []) as Story[]);
      if (user) {
        const { data: views, error: viewsError } = await supabase
          .from("story_views")
          .select("story_id")
          .eq("viewer_id", user.id);
        if (!viewsError) setSeenStoryIds(new Set((views || []).map((view) => view.story_id)));
      } else {
        setSeenStoryIds(new Set());
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refreshStories();
    const refreshId = window.setInterval(() => void refreshStories(), 60_000);
    return () => window.clearInterval(refreshId);
  }, [refreshStories]);

  const groups = useMemo<StoryGroup[]>(() => {
    const grouped = new Map<string, StoryGroup>();
    stories.forEach((story) => {
      const group = grouped.get(story.shop_id) ?? {
        shopId: story.shop_id,
        shopName: story.shop_name,
        sellerName: story.seller_name,
        stories: [],
      };
      group.stories.push(story);
      grouped.set(story.shop_id, group);
    });
    return Array.from(grouped.values()).sort((a, b) => {
      const latestA = a.stories[a.stories.length - 1]?.created_at ?? "";
      const latestB = b.stories[b.stories.length - 1]?.created_at ?? "";
      return latestB.localeCompare(latestA);
    });
  }, [stories]);

  const currentGroup = useMemo(
    () => groups.find((group) => group.stories.some((story) => story.id === activeStory?.id)),
    [activeStory, groups],
  );
  const currentGroupIndex = currentGroup ? groups.findIndex((group) => group.shopId === currentGroup.shopId) : -1;
  const currentStoryIndex = currentGroup?.stories.findIndex((story) => story.id === activeStory?.id) ?? -1;
  const isOwner = Boolean(activeStory && user?.id === activeStory.owner_id);

  const showStory = useCallback(async (story: Story) => {
    setActiveStory(story);
    setProgress(0);
    setViewCount(0);
    setReactionCounts({});
    setMyReaction(null);
    if (user && story.owner_id !== user.id) {
      const { error } = await supabase.from("story_views").upsert(
        { story_id: story.id, viewer_id: user.id },
        { onConflict: "story_id,viewer_id", ignoreDuplicates: true },
      );
      if (error) console.error("Could not mark story viewed:", error);
      else setSeenStoryIds((previous) => new Set(previous).add(story.id));
    }
    const { data } = await supabase.rpc("get_story_metrics", { _story_id: story.id });
    const metrics = Array.isArray(data) ? data[0] : data;
    if (metrics) {
      setViewCount(Number(metrics.view_count) || 0);
      setReactionCounts((metrics.reactions as Record<string, number>) || {});
    }
    if (user) {
      const { data: reaction } = await supabase
        .from("story_reactions")
        .select("emoji")
        .eq("story_id", story.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setMyReaction(reaction?.emoji ?? null);
    }
  }, [user]);

  const goNext = useCallback(() => {
    if (currentGroup && currentStoryIndex < currentGroup.stories.length - 1) {
      void showStory(currentGroup.stories[currentStoryIndex + 1]);
      return;
    }
    const nextGroup = groups[currentGroupIndex + 1];
    if (nextGroup) {
      void showStory(nextGroup.stories[0]);
      return;
    }
    setActiveStory(null);
  }, [currentGroup, currentGroupIndex, currentStoryIndex, groups, showStory]);

  const goPrevious = useCallback(() => {
    if (currentGroup && currentStoryIndex > 0) {
      void showStory(currentGroup.stories[currentStoryIndex - 1]);
      return;
    }
    const previousGroup = groups[currentGroupIndex - 1];
    if (previousGroup) void showStory(previousGroup.stories[previousGroup.stories.length - 1]);
  }, [currentGroup, currentGroupIndex, currentStoryIndex, groups, showStory]);

  useEffect(() => {
    if (!activeStory || activeStory.media_type.startsWith("video/")) return;
    setProgress(0);
    const start = Date.now();
    const timer = window.setInterval(() => {
      const nextProgress = Math.min(100, ((Date.now() - start) / STORY_DURATION) * 100);
      setProgress(nextProgress);
      if (nextProgress >= 100) {
        window.clearInterval(timer);
        goNext();
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [activeStory, goNext]);

  useEffect(() => {
    let cancelled = false;
    setReplies([]);
    setReplyText("");
    setShowReplies(false);
    if (!activeStory || !user) return;
    supabase.from("story_replies")
      .select("id, sender_id, message, created_at")
      .eq("story_id", activeStory.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Could not load story replies:", error);
          return;
        }
        setReplies(data || []);
      });
    return () => { cancelled = true; };
  }, [activeStory, user]);

  const handleCreate = async () => {
    if (!currentShop || !user || !selectedFile) return;
    setUploading(true);
    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "media";
    const storagePath = `${user.id}/stories/${currentShop.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    try {
      const { error: uploadError } = await supabase.storage.from("item-images").upload(storagePath, selectedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("item-images").getPublicUrl(storagePath);
      const { error } = await supabase.from("stories").insert({
        shop_id: currentShop.id,
        owner_id: user.id,
        shop_name: currentShop.name,
        seller_name: profile?.full_name || currentShop.name,
        media_url: publicUrl,
        media_type: selectedFile.type,
        caption: caption.trim() || null,
      });
      if (error) {
        await supabase.storage.from("item-images").remove([storagePath]);
        throw error;
      }
      toast({ title: "Story shared", description: "It will be visible for 24 hours." });
      setCreateOpen(false);
      setSelectedFile(null);
      setSelectedPreview(null);
      setCaption("");
      await refreshStories();
    } catch (error) {
      toast({ title: "Could not share story", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!activeStory) return;
    if (!user) {
      toast({ title: "Sign in to react", description: "You can still watch public stories without signing in." });
      return;
    }
    if (myReaction === emoji) {
      const { error } = await supabase.from("story_reactions").delete().eq("story_id", activeStory.id).eq("user_id", user.id);
      if (error) {
        toast({ title: "Could not remove reaction", description: error.message, variant: "destructive" });
        return;
      }
      setReactionCounts((previous) => ({ ...previous, [emoji]: Math.max((previous[emoji] || 1) - 1, 0) }));
      setMyReaction(null);
      return;
    }
    const { error } = await supabase.from("story_reactions").upsert(
      { story_id: activeStory.id, user_id: user.id, emoji },
      { onConflict: "story_id,user_id" },
    );
    if (error) {
      toast({ title: "Could not send reaction", description: error.message, variant: "destructive" });
      return;
    }
    setReactionCounts((previous) => {
      const next = { ...previous };
      if (myReaction) next[myReaction] = Math.max((next[myReaction] || 1) - 1, 0);
      next[emoji] = (next[emoji] || 0) + 1;
      return next;
    });
    setMyReaction(emoji);
  };

  const sendReply = async () => {
    if (!activeStory || !user || !replyText.trim()) return;
    if (user.id === activeStory.owner_id) {
      toast({ title: "This is your story", description: "Sellers can read replies from viewers here." });
      return;
    }
    setReplying(true);
    const message = replyText.trim();
    const { data, error } = await supabase.from("story_replies").insert({
      story_id: activeStory.id,
      sender_id: user.id,
      message,
    }).select("id, sender_id, message, created_at").single();
    setReplying(false);
    if (error) {
      toast({ title: "Could not send reply", description: error.message, variant: "destructive" });
      return;
    }
    if (data) setReplies((previous) => [...previous, data]);
    setReplyText("");
    setShowReplies(true);
    toast({ title: "Reply sent", description: "The seller can read your message." });
  };

  const deleteStory = async () => {
    if (!activeStory || !isOwner) return;
    const storagePath = activeStory.media_url.split("/object/public/item-images/")[1];
    const { error } = await supabase.from("stories").delete().eq("id", activeStory.id);
    if (error) {
      toast({ title: "Could not delete story", description: error.message, variant: "destructive" });
      return;
    }
    if (storagePath) await supabase.storage.from("item-images").remove([decodeURIComponent(storagePath)]);
    toast({ title: "Story deleted" });
    setActiveStory(null);
    await refreshStories();
  };

  const shareStory = async () => {
    const url = `${window.location.origin}/stories`;
    try {
      if (navigator.share) await navigator.share({ title: "Seller stories", url: window.location.href });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Share the public Stories page with your customers." });
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast({ title: "Could not share link", description: "Copy the page address from your browser." });
      }
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const supported = file.type.startsWith("image/") || ["video/mp4", "video/webm", "video/quicktime"].includes(file.type);
    if (!supported) {
      toast({ title: "Unsupported file", description: "Choose an image or MP4, WebM, or MOV video.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_MEDIA_SIZE) {
      toast({ title: "File is too large", description: "Stories must be under 50 MB.", variant: "destructive" });
      return;
    }
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
    setSelectedFile(file);
    setSelectedPreview(URL.createObjectURL(file));
  };

  useEffect(() => () => {
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
  }, [selectedPreview]);

  return (
    <section className={fullPage ? "mx-auto w-full max-w-5xl px-4 py-8 sm:px-8" : "min-w-0 max-w-full"} aria-label="Stories">
      {fullPage && (
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Stories</h1>
            <p className="text-sm text-muted-foreground">Discover what sellers are sharing today.</p>
          </div>
          <Button variant="outline" asChild><Link to="/dashboard">Seller dashboard</Link></Button>
        </div>
      )}

      <div className={fullPage ? "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5" : "flex max-w-full items-start gap-3 overflow-x-auto pb-2"}>
        {!fullPage && currentShop && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
            aria-label="Add a story"
          >
            <span className="relative grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-primary bg-primary/10 text-primary">
              <CirclePlus className="h-6 w-6" />
            </span>
            <span className="w-full truncate text-[11px] font-medium">Your story</span>
          </button>
        )}
        {loading && <div className="flex h-16 items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>}
        {!loading && groups.map((group) => {
          const ownGroup = group.stories.some((story) => story.owner_id === user?.id);
          const cover = group.stories[group.stories.length - 1];
          const groupSeen = group.stories.every((story) => seenStoryIds.has(story.id));
          return (
            <button
              key={group.shopId}
              type="button"
              onClick={() => void showStory(group.stories.find((story) => !seenStoryIds.has(story.id)) || group.stories[0])}
              className={`flex ${fullPage ? "w-full" : "w-16 shrink-0"} flex-col items-center gap-1.5 text-center`}
              aria-label={`View ${group.shopName} stories`}
            >
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full p-[3px] ${ownGroup || groupSeen ? "border-2 border-muted-foreground/40" : "bg-gradient-to-tr from-secondary via-primary to-primary"}`}>
                <span className="grid h-full w-full place-items-center overflow-hidden rounded-full border-2 border-background bg-card text-sm font-semibold">
                  {cover.media_type.startsWith("video/") ? <Video className="h-5 w-5" /> : <img src={cover.media_url} alt="" className="h-full w-full object-cover" />}
                </span>
              </span>
              <span className="w-full truncate text-[11px] font-medium">{group.shopName}</span>
            </button>
          );
        })}
        {!loading && fullPage && groups.length === 0 && <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No active stories right now.</p>}
        {!fullPage && groups.length > 0 && (
          <Link to="/stories" className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center" aria-label="See all stories">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-border bg-card text-primary"><Play className="h-5 w-5" /></span>
            <span className="w-full truncate text-[11px] font-medium">All stories</span>
          </Link>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogTitle>Share a story</DialogTitle>
          <p className="text-sm text-muted-foreground">Visible to everyone for 24 hours.</p>
          <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => fileRef.current?.click()}>
            {selectedFile?.type.startsWith("video/") ? <Video className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {selectedFile?.name || "Choose a photo or video"}
          </Button>
          {selectedFile && selectedPreview && (
            <div className="overflow-hidden rounded-md border border-border bg-muted/20">
              {selectedFile.type.startsWith("video/") ? <video src={selectedPreview} controls className="max-h-56 w-full object-contain" /> : <img src={selectedPreview} alt="Story preview" className="max-h-56 w-full object-contain" />}
            </div>
          )}
          <Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Add a caption" maxLength={240} />
          <Button onClick={() => void handleCreate()} disabled={!selectedFile || uploading || !currentShop} className="w-full">
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Share story
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeStory} onOpenChange={(open) => !open && setActiveStory(null)}>
        <DialogContent className="h-[min(88vh,760px)] w-[calc(100%-1rem)] max-w-md overflow-hidden border-border bg-background p-0">
          <DialogTitle className="sr-only">{currentGroup?.shopName || "Story"}</DialogTitle>
          {activeStory && (
            <div className="relative flex h-full flex-col overflow-hidden bg-card">
              <div className="absolute left-3 right-3 top-3 z-20 flex gap-1">
                {currentGroup?.stories.map((story) => (
                  <span key={story.id} className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/30">
                    <span className="block h-full bg-foreground" style={{ width: story.id === activeStory.id ? `${progress}%` : currentGroup.stories.findIndex((item) => item.id === story.id) < currentStoryIndex ? "100%" : "0%" }} />
                  </span>
                ))}
              </div>
              <div className="absolute left-4 right-10 top-7 z-20 flex items-center gap-2 text-primary-foreground drop-shadow-md">
                  <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-primary-foreground/70 bg-background/30 text-sm font-semibold">
                  {currentGroup?.shopName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{currentGroup?.shopName}</p>
                  <p className="text-[11px] opacity-80">{new Date(activeStory.created_at).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-background/20" onClick={() => void shareStory()} aria-label="Share stories link"><Share2 className="h-4 w-4" /></Button>
                {isOwner && <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-background/20" onClick={() => void deleteStory()} aria-label="Delete story"><Trash2 className="h-4 w-4" /></Button>}
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-background/20" onClick={() => setActiveStory(null)} aria-label="Close story"><X className="h-4 w-4" /></Button>
              </div>
              <div className="absolute inset-0 grid place-items-center bg-foreground/90">
                {activeStory.media_type.startsWith("video/") ? (
                  <video src={activeStory.media_url} autoPlay muted controls playsInline onEnded={goNext} onTimeUpdate={(event) => {
                    const video = event.currentTarget;
                    if (Number.isFinite(video.duration) && video.duration > 0) setProgress((video.currentTime / video.duration) * 100);
                  }} className="h-full w-full object-contain" />
                ) : <img src={activeStory.media_url} alt={activeStory.caption || `${currentGroup?.shopName} story`} className="h-full w-full object-contain" />}
              </div>
              <button type="button" onClick={goPrevious} className="absolute inset-y-16 left-0 z-10 w-1/4" aria-label="Previous story" />
              <button type="button" onClick={goNext} className="absolute inset-y-16 right-0 z-10 w-1/4" aria-label="Next story" />
              <Button variant="ghost" size="icon" onClick={goPrevious} className="absolute left-1 top-1/2 z-20 -translate-y-1/2 text-primary-foreground" aria-label="Previous story"><ChevronLeft /></Button>
              <Button variant="ghost" size="icon" onClick={goNext} className="absolute right-1 top-1/2 z-20 -translate-y-1/2 text-primary-foreground" aria-label="Next story"><ChevronRight /></Button>
              <div className="absolute inset-x-0 bottom-0 z-20 space-y-3 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-4 pb-4 pt-14 text-foreground">
                {activeStory.caption && <p className="text-sm leading-relaxed">{activeStory.caption}</p>}
                {isOwner && replies.length > 0 && (
                  <div className="space-y-2">
                    <Button variant="ghost" size="sm" className="h-7 px-0 text-xs" onClick={() => setShowReplies((shown) => !shown)}>
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" />Replies ({replies.length})
                    </Button>
                    {showReplies && <div className="max-h-24 space-y-1 overflow-y-auto rounded-md bg-background/50 p-2">
                      {replies.map((reply) => <p key={reply.id} className="text-xs"><span className="font-medium">Viewer</span><span className="ml-2 text-muted-foreground">{reply.message}</span></p>)}
                    </div>}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  {isOwner ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-4 w-4" />{viewCount} views</span>
                  ) : <span className="text-xs text-muted-foreground">React to this story</span>}
                  {isOwner ? (
                    <div className="flex items-center gap-2 text-xs" aria-label="Story reactions">
                      {REACTIONS.filter((emoji) => (reactionCounts[emoji] || 0) > 0).map((emoji) => (
                        <span key={emoji}>{emoji} {reactionCounts[emoji]}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {REACTIONS.map((emoji) => (
                        <Button key={emoji} type="button" variant={myReaction === emoji ? "secondary" : "ghost"} size="sm" className="h-9 min-w-9 px-2" onClick={() => void handleReaction(emoji)} aria-label={`React ${emoji}`}>
                          <span>{emoji}</span>{(reactionCounts[emoji] || 0) > 0 && <span className="ml-1 text-[10px]">{reactionCounts[emoji]}</span>}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                {!isOwner && <form className="flex items-center gap-2" onSubmit={(event) => { event.preventDefault(); void sendReply(); }}>
                  <Input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder={user ? "Reply to seller…" : "Sign in to reply"} disabled={!user || replying} maxLength={500} className="h-9 rounded-full border-foreground/20 bg-background/40 text-sm" />
                  <Button type="submit" variant="secondary" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={!user || !replyText.trim() || replying} aria-label="Send story reply">
                    {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>}
                {!user && !isOwner && <Link to="/auth" className="text-xs text-primary underline underline-offset-2">Sign in to reply or react</Link>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default StoriesExperience;