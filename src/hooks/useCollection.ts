import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface CollectionItem {
  id: string;
  pokemon_id: number;
}

export function useCollection() {
  const { user } = useAuth();
  const [collection, setCollection] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // Charger la collection initiale
  useEffect(() => {
    if (!user) {
      setCollection(new Set());
      setLoading(false);
      return;
    }

    const loadCollection = async () => {
      try {
        const { data, error } = await supabase
          .from('user_collections')
          .select('pokemon_id')
          .eq('user_id', user.id);

        if (error) throw error;

        setCollection(new Set(data.map(item => item.pokemon_id)));
      } catch (error) {
        console.error('Error loading collection:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollection();

    // Souscrire aux changements en temps réel
    const subscription = supabase
      .channel('user_collections_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_collections',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCollection(prev => new Set([...prev, payload.new.pokemon_id]));
        } else if (payload.eventType === 'DELETE') {
          setCollection(prev => {
            const newSet = new Set(prev);
            newSet.delete(payload.old.pokemon_id);
            return newSet;
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const togglePokemon = async (pokemonId: number) => {
    if (!user) return;

    try {
      const hasItem = collection.has(pokemonId);

      if (hasItem) {
        // Supprimer de la collection
        const { error } = await supabase
          .from('user_collections')
          .delete()
          .eq('user_id', user.id)
          .eq('pokemon_id', pokemonId);

        if (error) throw error;
      } else {
        // Ajouter à la collection
        const { error } = await supabase
          .from('user_collections')
          .insert({
            user_id: user.id,
            pokemon_id: pokemonId,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling pokemon:', error);
    }
  };

  return {
    collection,
    loading,
    togglePokemon,
    hasPokemon: (pokemonId: number) => collection.has(pokemonId),
  };
} 