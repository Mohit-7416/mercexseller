import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';

export type BidStatus = 'active' | 'won' | 'outbid' | 'cancelled';

export interface Bid {
  id: string;
  listing_id: string;
  bidder_id: string;
  amount: number;
  status: BidStatus;
  created_at: string;
}

export const useBids = () => {
  const { currentShop } = useShop();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = useCallback(async () => {
    if (!currentShop) {
      setBids([]);
      setLoading(false);
      return;
    }

    try {
      // First get all listings for this shop
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id')
        .eq('shop_id', currentShop.id);

      if (listingsError) throw listingsError;
      
      if (!listings || listings.length === 0) {
        setBids([]);
        setLoading(false);
        return;
      }

      const listingIds = listings.map(l => l.id);

      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  }, [currentShop]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  // Derived data
  const activeBids = bids.filter(b => b.status === 'active');

  return { 
    bids, 
    loading, 
    refreshBids: fetchBids,
    activeBids
  };
};
