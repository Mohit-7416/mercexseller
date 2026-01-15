import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';

export interface Item {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  quantity: number;
  price: number;
  cost_price: number | null;
  sku: string | null;
  variants: any;
  dimensions: any;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useItems = () => {
  const { currentShop } = useShop();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!currentShop) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }, [currentShop]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (itemData: Partial<Item>) => {
    if (!currentShop) return { data: null, error: new Error('No shop selected') };

    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          shop_id: currentShop.id,
          name: itemData.name || 'Untitled Item',
          description: itemData.description,
          category_id: itemData.category_id,
          subcategory_id: itemData.subcategory_id,
          quantity: itemData.quantity || 0,
          price: itemData.price || 0,
          cost_price: itemData.cost_price,
          sku: itemData.sku,
          variants: itemData.variants || [],
          dimensions: itemData.dimensions,
          images: itemData.images || []
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchItems();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const updateItem = async (id: string, itemData: Partial<Item>) => {
    try {
      const { error } = await supabase
        .from('items')
        .update(itemData)
        .eq('id', id);

      if (error) throw error;
      
      await fetchItems();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchItems();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return { items, loading, createItem, updateItem, deleteItem, refreshItems: fetchItems };
};
