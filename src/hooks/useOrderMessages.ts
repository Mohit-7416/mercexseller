import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_type: 'seller' | 'buyer';
  sender_id: string | null;
  message: string;
  created_at: string;
}

export const useOrderMessages = (orderId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!orderId || orderId.startsWith('mock-')) {
      // Generate mock conversation for mock orders
      setMessages(generateMockMessages(orderId || ''));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as OrderMessage[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!orderId || orderId.startsWith('mock-')) return;

    const channel = supabase
      .channel(`order-messages-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as OrderMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const sendMessage = async (message: string) => {
    if (!orderId || !user) return { error: new Error('Missing order or user') };

    if (orderId.startsWith('mock-')) {
      // For mock orders, just add locally
      const mockMsg: OrderMessage = {
        id: `mock-msg-${Date.now()}`,
        order_id: orderId,
        sender_type: 'seller',
        sender_id: user.id,
        message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, mockMsg]);
      return { error: null };
    }

    try {
      const { error } = await supabase.from('order_messages').insert({
        order_id: orderId,
        sender_type: 'seller',
        sender_id: user.id,
        message,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return { messages, loading, sendMessage };
};

function generateMockMessages(orderId: string): OrderMessage[] {
  const now = new Date();
  return [
    {
      id: 'mock-m1',
      order_id: orderId,
      sender_type: 'buyer',
      sender_id: null,
      message: 'Hi, I placed my order. When can I expect shipping?',
      created_at: new Date(now.getTime() - 3600000 * 5).toISOString(),
    },
    {
      id: 'mock-m2',
      order_id: orderId,
      sender_type: 'seller',
      sender_id: null,
      message: 'Hello! Your order is being processed. We\'ll ship it within 24 hours.',
      created_at: new Date(now.getTime() - 3600000 * 4).toISOString(),
    },
    {
      id: 'mock-m3',
      order_id: orderId,
      sender_type: 'buyer',
      sender_id: null,
      message: 'Great, thank you! Can I also get the tracking number once it ships?',
      created_at: new Date(now.getTime() - 3600000 * 3).toISOString(),
    },
    {
      id: 'mock-m4',
      order_id: orderId,
      sender_type: 'seller',
      sender_id: null,
      message: 'Absolutely, we\'ll share the tracking details as soon as the package is dispatched.',
      created_at: new Date(now.getTime() - 3600000 * 2).toISOString(),
    },
  ];
}
