import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  gst_number: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ShopContextType {
  shops: Shop[];
  currentShop: Shop | null;
  loading: boolean;
  setCurrentShop: (shop: Shop | null) => void;
  createShop: (shopData: Partial<Shop>) => Promise<{ data: Shop | null; error: Error | null }>;
  updateShop: (id: string, shopData: Partial<Shop>) => Promise<{ error: Error | null }>;
  refreshShops: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShops = async () => {
    if (!user) {
      setShops([]);
      setCurrentShop(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShops(data || []);
      
      // Set first shop as current if no current shop selected
      if (data && data.length > 0 && !currentShop) {
        const savedShopId = localStorage.getItem('currentShopId');
        const savedShop = data.find(s => s.id === savedShopId);
        setCurrentShop(savedShop || data[0]);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [user]);

  useEffect(() => {
    if (currentShop) {
      localStorage.setItem('currentShopId', currentShop.id);
    }
  }, [currentShop]);

  const createShop = async (shopData: Partial<Shop>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('shops')
        .insert({
          owner_id: user.id,
          name: shopData.name || 'My Shop',
          gst_number: shopData.gst_number,
          address_line: shopData.address_line,
          city: shopData.city,
          state: shopData.state,
          country: shopData.country || 'India',
          postal_code: shopData.postal_code
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchShops();
      if (data) setCurrentShop(data);
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const updateShop = async (id: string, shopData: Partial<Shop>) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update(shopData)
        .eq('id', id);

      if (error) throw error;
      
      await fetchShops();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshShops = async () => {
    await fetchShops();
  };

  return (
    <ShopContext.Provider value={{
      shops,
      currentShop,
      loading,
      setCurrentShop,
      createShop,
      updateShop,
      refreshShops
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
