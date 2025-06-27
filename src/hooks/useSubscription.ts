import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'cancelled' | 'past_due';
  subscription_type: 'free' | 'premium';
  start_date: string;
  end_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, clearing subscription');
        setSubscription(null);
        setLoading(false);
        return;
      }

      console.log('Fetching subscription for user:', user.id);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Subscription fetch error:', error);
        throw error;
      }

      console.log('Subscription data:', data);
      setSubscription(data);
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();

    // Souscrire aux changements en temps réel
    const channel = supabase
      .channel('user_subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
        },
        async (payload: RealtimePostgresChangesPayload<{
          id: string;
          user_id: string;
          [key: string]: any;
        }>) => {
          console.log('Subscription changed:', payload);
          const { data: { user } } = await supabase.auth.getUser();
          if (user && payload.new?.user_id === user.id) {
            console.log('Updating subscription for current user');
            await fetchSubscription();
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      channel.unsubscribe();
    };
  }, []);

  const isPremium = subscription?.status === 'active' && 
    subscription?.subscription_type === 'premium' &&
    (!subscription.end_date || new Date(subscription.end_date) > new Date());

  const subscribe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          status: 'active',
          subscription_type: 'premium',
          start_date: new Date().toISOString(),
          end_date: null
        })
        .select()
        .single();

      if (error) {
        console.error('Subscribe error:', error);
        throw error;
      }
      
      setSubscription(data);
      return data;
    } catch (err: any) {
      console.error('Subscribe error:', err);
      setError(err.message);
      throw err;
    }
  };

  const cancelSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          end_date: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Cancel subscription error:', error);
        throw error;
      }
      
      setSubscription(data);
      return data;
    } catch (err: any) {
      console.error('Cancel subscription error:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    subscription,
    loading,
    error,
    isPremium,
    refetch: fetchSubscription,
    subscribe,
    cancelSubscription
  };
} 