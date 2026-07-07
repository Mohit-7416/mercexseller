import { motion } from "framer-motion";
import { Star, Pin, PinOff, MessageSquare, Loader2, Reply, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReviews } from "@/hooks/useReviews";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";

const StarRow = ({ value, size = "w-4 h-4" }: { value: number; size?: string }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className={`${size} ${i <= Math.round(value) ? 'fill-primary text-primary' : 'text-muted-foreground/40'}`}
      />
    ))}
  </div>
);

const Reviews = () => {
  const { reviews, loading, stats, reply, togglePin } = useReviews();
  const { toast } = useToast();
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const submitReply = async (id: string) => {
    const text = (replyDraft[id] || '').trim();
    if (!text) return;
    setBusy(id);
    const { error } = await reply(id, text);
    setBusy(null);
    if (error) {
      toast({ title: 'Reply failed', description: error.message, variant: 'destructive' });
    } else {
      setOpenReplyFor(null);
      setReplyDraft(prev => ({ ...prev, [id]: '' }));
      toast({ title: 'Reply posted' });
    }
  };

  const handlePin = async (id: string, next: boolean) => {
    setBusy(id);
    const { error } = await togglePin(id, next);
    setBusy(null);
    if (error) toast({ title: 'Action failed', description: error.message, variant: 'destructive' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pinnedCount = reviews.filter(r => r.pinned).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <BackButton />
        <div>
          <h1 className="text-xl md:text-3xl font-bold mb-0.5">Ratings & Reviews</h1>
          <p className="text-sm text-muted-foreground">See what buyers say and reply back.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-card/40 border border-border/50 flex flex-col items-center justify-center text-center">
          <p className="text-5xl font-bold text-primary">{stats.average.toFixed(1)}</p>
          <StarRow value={stats.average} size="w-5 h-5" />
          <p className="text-sm text-muted-foreground mt-2">{stats.total} review{stats.total === 1 ? '' : 's'}</p>
        </div>
        <div className="md:col-span-2 p-6 rounded-2xl bg-card/40 border border-border/50 space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = stats.counts[star as 1|2|3|4|5] || 0;
            const pct = stats.total ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <div className="w-14 flex items-center gap-1 shrink-0">
                  <span className="font-medium">{star}</span>
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                </div>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right text-muted-foreground tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="p-12 rounded-2xl bg-card/30 border border-border/30 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm text-muted-foreground">Buyer reviews will appear here once you start selling.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Pinned: {pinnedCount}/10</p>
          {reviews.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${r.pinned ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-card/40'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{r.buyer?.full_name || r.buyer?.email || 'Buyer'}</p>
                    <StarRow value={r.rating} />
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    {r.pinned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Pinned</span>}
                  </div>
                  {r.comment && <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap">{r.comment}</p>}

                  {r.seller_reply && (
                    <div className="mt-3 ml-4 pl-3 border-l-2 border-primary/40">
                      <p className="text-xs text-primary font-medium mb-0.5">Your reply</p>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{r.seller_reply}</p>
                    </div>
                  )}

                  {openReplyFor === r.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={replyDraft[r.id] || ''}
                        onChange={e => setReplyDraft(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Write a reply to this buyer..."
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => submitReply(r.id)} disabled={busy === r.id} className="gap-1">
                          <Send className="w-3.5 h-3.5" /> Post reply
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setOpenReplyFor(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setOpenReplyFor(openReplyFor === r.id ? null : r.id)}
                    title={r.seller_reply ? 'Edit reply' : 'Reply'}
                  >
                    <Reply className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${r.pinned ? 'text-primary' : ''}`}
                    onClick={() => handlePin(r.id, !r.pinned)}
                    disabled={busy === r.id || (!r.pinned && pinnedCount >= 10)}
                    title={r.pinned ? 'Unpin' : (pinnedCount >= 10 ? 'Pin limit reached (10)' : 'Pin review')}
                  >
                    {r.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
