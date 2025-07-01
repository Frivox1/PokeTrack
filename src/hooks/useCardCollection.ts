import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { cleanPokemonName } from '@/utils/cleanPokemonName';

interface CollectionItem {
  id: string;
  card_id: string;
  set_name: string;
  series: string;
  pokemon_name: string;
  created_at: string;
}

export function useCardCollection() {
  const { user } = useAuth();
  const [collection, setCollection] = useState<Set<CollectionItem>>(new Set());
  const [loading, setLoading] = useState(true);
  const prevUserId = useRef<string | null>(null);

  // Fonction pour recharger explicitement la collection
  const reloadCollection = useCallback(async (forceReload = false) => {
    if (!user) {
      setCollection(new Set());
      setLoading(false);
      prevUserId.current = null;
      return;
    }
    // Ne recharge que si l'utilisateur a changé, si la collection est vide, ou si forceReload est true
    if (!forceReload && prevUserId.current === user.id && collection.size > 0) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_card_collections')
        .select('id, card_id, set_name, series, pokemon_name, created_at')
        .eq('user_id', user.id);
      if (error) throw error;
      setCollection(new Set(data));
      prevUserId.current = user.id;
    } catch (error) {
      console.error('Error loading card collection:', error);
    } finally {
      setLoading(false);
    }
  }, [user, collection.size]);

  // Charger la collection initiale
  useEffect(() => {
    reloadCollection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleCard = async (cardId: string, setName: string, series: string, pokemonName: string) => {
    if (!user) return;

    // Nettoie le nom du Pokémon avant de l'utiliser
    const cleanedPokemonName = cleanPokemonName(pokemonName);

    try {
      const hasCard = Array.from(collection).some(item => item.card_id === cardId);

      if (hasCard) {
        // Supprimer uniquement la carte précise
        const { error } = await supabase
          .from('user_card_collections')
          .delete()
          .eq('user_id', user.id)
          .eq('card_id', cardId);

        if (error) throw error;
        setCollection(prev => {
          const newSet = new Set(Array.from(prev).filter(item => item.card_id !== cardId));
          return newSet;
        });
      } else {
        // Ajouter à la collection avec le nom nettoyé
        const { data, error } = await supabase
          .from('user_card_collections')
          .insert({
            user_id: user.id,
            card_id: cardId,
            set_name: setName,
            series: series,
            pokemon_name: cleanedPokemonName,
          })
          .select('id, card_id, set_name, series, pokemon_name, created_at')
          .single();

        if (error) throw error;
        setCollection(prev => new Set([...prev, data as CollectionItem]));
      }
    } catch (error) {
      console.error('Error toggling card:', error);
    }
  };

  return {
    collection,
    loading,
    toggleCard,
    hasCard: (cardId: string) => Array.from(collection).some(item => item.card_id === cardId),
    reloadCollection,
  };
} 