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
  const { user, loading: authLoading } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShopState] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const setCurrentShop = (shop: Shop | null) => {
    if (shop) {
      localStorage.setItem('currentShopId', shop.id);
    } else {
      localStorage.removeItem('currentShopId');
    }
    setCurrentShopState(shop);
  };

  const fetchShops = async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user?.id) {
      setShops([]);
      setCurrentShopState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShops(data || []);
      
      if (data && data.length > 0) {
        const savedShopId = localStorage.getItem('currentShopId');
        setCurrentShopState((previousShop) => {
          const previousStillExists = previousShop
            ? data.find((shop) => shop.id === previousShop.id)
            : null;
          const savedShop = savedShopId ? data.find((shop) => shop.id === savedShopId) : null;
          const nextShop = previousStillExists || savedShop || data[0];
          localStorage.setItem('currentShopId', nextShop.id);
          return nextShop;
        });
      } else {
        setCurrentShop(null);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

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
