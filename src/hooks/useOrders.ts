import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { subDays } from 'date-fns';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  shop_id: string;
  listing_id: string | null;
  buyer_id: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  shipping_address: any;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const generateMockOrders = (shopId: string): Order[] => {
  const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const names = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh', 'Anjali Nair', 'Rohan Mehta', 'Kavita Joshi', 'Suresh Reddy', 'Meena Iyer', 'Arjun Das', 'Pooja Verma'];
  const emails = names.map(n => n.toLowerCase().replace(' ', '.') + '@example.com');

  return Array.from({ length: 15 }, (_, i) => {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = subDays(new Date(), daysAgo);
    const subtotal = Math.floor(Math.random() * 15000) + 500;
    const shipping = Math.floor(Math.random() * 200) + 50;
    const tax = Math.round(subtotal * 0.18);
    const nameIdx = Math.floor(Math.random() * names.length);

    return {
      id: `mock-${i}`,
      order_number: `ORD-${String(1000 + i).padStart(4, '0')}`,
      shop_id: shopId,
      listing_id: null,
      buyer_id: null,
      buyer_name: names[nameIdx],
      buyer_email: emails[nameIdx],
      buyer_phone: null,
      shipping_address: null,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      subtotal,
      shipping_cost: shipping,
      tax,
      total: subtotal + shipping + tax,
      payment_method: Math.random() > 0.5 ? 'UPI' : 'Card',
      payment_status: 'paid',
      notes: null,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const useOrders = () => {
  const { currentShop } = useShop();
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!currentShop) {
      setDbOrders([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDbOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [currentShop]);

  // Use mock data when no real orders exist
  const orders = useMemo(() => {
    if (dbOrders.length > 0) return dbOrders;
    if (!currentShop) return [];
    return generateMockOrders(currentShop.id);
  }, [dbOrders, currentShop]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      await fetchOrders();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Derived data
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const processingOrders = orders.filter(o => o.status === 'processing');
  const completedOrders = orders.filter(o => o.status === 'delivered');

  return { 
    orders, 
    loading, 
    updateOrderStatus, 
    refreshOrders: fetchOrders,
    pendingOrders,
    processingOrders,
    completedOrders
  };
};
