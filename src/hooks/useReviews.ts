import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
  id: string;
  seller_id: string;
  buyer_id: string;
  shop_id: string | null;
  order_id: string | null;
  rating: number;
  comment: string | null;
  seller_reply: string | null;
  seller_replied_at: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  buyer?: { full_name: string | null; email: string | null } | null;
}

export interface RatingStats {
  average: number;
  total: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
}

export const useReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setReviews([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*, buyer:profiles!reviews_buyer_id_fkey(full_name,email)')
      .eq('seller_id', user.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error) setReviews((data as any) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const stats: RatingStats = (() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    let sum = 0;
    reviews.forEach(r => { counts[r.rating as 1|2|3|4|5] = (counts[r.rating as 1|2|3|4|5] || 0) + 1; sum += r.rating; });
    return { average: reviews.length ? sum / reviews.length : 0, total: reviews.length, counts };
  })();

  const reply = async (id: string, text: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ seller_reply: text, seller_replied_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await fetch();
    return { error };
  };

  const togglePin = async (id: string, pinned: boolean) => {
    if (pinned) {
      const currentPinned = reviews.filter(r => r.pinned).length;
      if (currentPinned >= 10) {
        return { error: new Error('You can pin up to 10 reviews only.') };
      }
    }
    const { error } = await supabase.from('reviews').update({ pinned }).eq('id', id);
    if (!error) await fetch();
    return { error };
  };

  return { reviews, loading, stats, reply, togglePin, refetch: fetch };
};
