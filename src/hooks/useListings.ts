import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';

export type ListingType = 'auction' | 'live_sale';
export type ListingStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface Listing {
  id: string;
  shop_id: string;
  listing_code: string;
  type: ListingType;
  status: ListingStatus;
  title: string;
  description: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  thumbnail_url: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  starting_price: number | null;
  current_price: number | null;
  reserve_price: number | null;
  viewers_count: number;
  created_at: string;
  updated_at: string;
}

export const useListings = () => {
  const { currentShop } = useShop();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    if (!currentShop) {
      setListings([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  }, [currentShop]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const generateListingCode = (type: ListingType) => {
    const prefix = type === 'auction' ? 'AUC' : 'SAL';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  };

  const createListing = async (listingData: Partial<Listing>) => {
    if (!currentShop) return { data: null, error: new Error('No shop selected') };

    try {
      const type = listingData.type || 'auction';
      const { data, error } = await supabase
        .from('listings')
        .insert({
          shop_id: currentShop.id,
          listing_code: generateListingCode(type),
          type,
          status: listingData.status || 'draft',
          title: listingData.title || 'Untitled Listing',
          description: listingData.description,
          category_id: listingData.category_id,
          subcategory_id: listingData.subcategory_id,
          thumbnail_url: listingData.thumbnail_url,
          scheduled_start: listingData.scheduled_start,
          scheduled_end: listingData.scheduled_end,
          starting_price: listingData.starting_price,
          current_price: listingData.current_price,
          reserve_price: listingData.reserve_price
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchListings();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const updateListing = async (id: string, listingData: Partial<Listing>) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update(listingData)
        .eq('id', id);

      if (error) throw error;
      
      await fetchListings();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const deleteListing = async (id: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchListings();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Derived data
  const draftListings = listings.filter(l => l.status === 'draft');
  const liveListings = listings.filter(l => l.status === 'live');
  const scheduledListings = listings.filter(l => l.status === 'scheduled');
  const activeListings = listings.filter(l => l.status === 'live' || l.status === 'scheduled');

  return { 
    listings, 
    loading, 
    createListing, 
    updateListing, 
    deleteListing, 
    refreshListings: fetchListings,
    draftListings,
    liveListings,
    scheduledListings,
    activeListings
  };
};
