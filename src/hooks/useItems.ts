import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import type { Json } from '@/integrations/supabase/types';

export interface ColorVariant {
  id: string;
  name: string;
  hex: string;
  quantity: number;
}

export interface ParameterValue {
  id: string;
  value: string;
  hex?: string;
}

export interface Parameter {
  id: string;
  name: string;
  values: ParameterValue[];
  isColor: boolean;
}

export interface Variant {
  id: string;
  parameterValues: Record<string, ParameterValue>;
  quantity: number;
  skuOverride?: string;
}

export interface ItemDimensions {
  custom_category?: string | null;
  custom_subcategory?: string | null;
  parameters?: Parameter[];
  variants?: Variant[];
  [key: string]: any;
}

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
  variants: ColorVariant[] | null;
  dimensions: ItemDimensions | null;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Type for database row
interface DbItem {
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
  variants: Json | null;
  dimensions: Json | null;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const parseDbItem = (dbItem: DbItem): Item => {
  return {
    ...dbItem,
    variants: Array.isArray(dbItem.variants) ? dbItem.variants as unknown as ColorVariant[] : null,
    dimensions: dbItem.dimensions as ItemDimensions | null
  };
};

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
      setItems((data || []).map(parseDbItem));
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
      const insertData = {
        shop_id: currentShop.id,
        name: itemData.name || 'Untitled Item',
        description: itemData.description,
        category_id: itemData.category_id,
        subcategory_id: itemData.subcategory_id,
        quantity: itemData.quantity || 0,
        price: itemData.price || 0,
        cost_price: itemData.cost_price,
        sku: itemData.sku,
        variants: itemData.variants as unknown as Json || null,
        dimensions: itemData.dimensions as unknown as Json || null,
        images: itemData.images || []
      };

      const { data, error } = await supabase
        .from('items')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      await fetchItems();
      return { data: parseDbItem(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const updateItem = async (id: string, itemData: Partial<Item>) => {
    try {
      const updateData: Record<string, any> = {};
      
      if (itemData.name !== undefined) updateData.name = itemData.name;
      if (itemData.description !== undefined) updateData.description = itemData.description;
      if (itemData.category_id !== undefined) updateData.category_id = itemData.category_id;
      if (itemData.subcategory_id !== undefined) updateData.subcategory_id = itemData.subcategory_id;
      if (itemData.quantity !== undefined) updateData.quantity = itemData.quantity;
      if (itemData.price !== undefined) updateData.price = itemData.price;
      if (itemData.cost_price !== undefined) updateData.cost_price = itemData.cost_price;
      if (itemData.sku !== undefined) updateData.sku = itemData.sku;
      if (itemData.variants !== undefined) updateData.variants = itemData.variants as unknown as Json;
      if (itemData.dimensions !== undefined) updateData.dimensions = itemData.dimensions as unknown as Json;
      if (itemData.images !== undefined) updateData.images = itemData.images;
      if (itemData.is_active !== undefined) updateData.is_active = itemData.is_active;

      const { error } = await supabase
        .from('items')
        .update(updateData)
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
