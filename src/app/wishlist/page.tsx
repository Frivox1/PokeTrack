"use client";
import Link from 'next/link';
import { ArrowLeftIcon, MagnifyingGlassIcon, HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export const dynamic = "force-static";

export default function WishlistPage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]); // card_id[]
  const [wishlistCards, setWishlistCards] = useState<any[]>([]); // infos complètes
  const [liking, setLiking] = useState<string | null>(null);

  // Charger la wishlist de l'utilisateur
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setWishlist([]);
        setWishlistCards([]);
        return;
      }
      const { data, error } = await supabase
        .from('wishlist')
        .select('card_id')
        .eq('user_id', user.id);
      if (!error && data) {
        const ids = data.map((item: any) => item.card_id);
        setWishlist(ids);
        // Charger les infos des cartes wishlist
        if (ids.length > 0) {
          try {
            const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
              headers: {
                'X-Api-Key': process.env.NEXT_PUBLIC_POKEMON_API_KEY
              },
              params: {
                q: ids.map(id => `id:${id}`).join(' OR '),
                pageSize: 50
              }
            });
            setWishlistCards(response.data.data);
          } catch {
            setWishlistCards([]);
          }
        } else {
          setWishlistCards([]);
        }
      }
    };
    fetchWishlist();
  }, [user]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
        headers: {
          'X-Api-Key': process.env.NEXT_PUBLIC_POKEMON_API_KEY
        },
        params: {
          q: `name:\"${search.trim()}\"`,
          orderBy: '-set.releaseDate',
          pageSize: 20
        }
      });
      setResults(response.data.data);
    } catch (err) {
      setError('Error fetching cards.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (card: any) => {
    if (!user) return;
    setLiking(card.id);
    const isLiked = wishlist.includes(card.id);
    if (isLiked) {
      // Supprimer de la wishlist
      await supabase.from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', card.id);
      setWishlist(prev => prev.filter(id => id !== card.id));
      setWishlistCards(prev => prev.filter(c => c.id !== card.id));
    } else {
      // Ajouter à la wishlist
      await supabase.from('wishlist').upsert({
        user_id: user.id,
        card_id: card.id,
        card_name: card.name,
        set_name: card.set.name,
        series: card.set.series,
        image_url: card.images.small,
      });
      setWishlist(prev => [...prev, card.id]);
      setWishlistCards(prev => [...prev, card]);
    }
    setLiking(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Search field */}
      <div className="flex flex-col mt-28 items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Search Pokémon..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg pr-12"
          />
          {search.trim() && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              onClick={handleSearch}
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
      {/* Résultats de recherche OU wishlist */}
      <div className="flex-1 flex flex-col items-center mt-16 mb-16">
        {loading && <div className="text-gray-500">Searching...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {search.trim() ? (
          !loading && !error && results.length > 0 ? (
            <div className="w-full max-w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {results.map(card => {
                const isLiked = wishlist.includes(card.id);
                return (
                  <div key={card.id} className="bg-white rounded-lg shadow p-2 flex flex-col items-center min-w-[210px] max-w-[260px] mx-auto">
                    <img src={card.images.small} alt={card.name} className="w-40 h-56 object-contain mb-1" />
                    <div className="font-semibold text-gray-800 text-center">{card.name}</div>
                    <div className="text-xs text-gray-500 text-center">{card.set.name}</div>
                    <div className="text-xs text-gray-400 text-center">{card.set.series}</div>
                    {user && (
                      <button
                        className={`mt-2 ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                        onClick={() => handleLike(card)}
                        disabled={liking === card.id}
                        aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        {isLiked ? <HeartSolid className="w-6 h-6" /> : <HeartOutline className="w-6 h-6" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) :
          !loading && !error && results.length === 0 && search.trim() ? (
            <div className="text-gray-400 mt-8">No cards found.</div>
          ) : null
        ) : (
          wishlistCards.length === 0 ? (
            <span className="text-gray-400 text-xl mt-16">Your wishlist is empty.</span>
          ) : (
            <div className="w-full max-w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {wishlistCards.map(card => (
                <div key={card.id} className="bg-white rounded-lg shadow p-2 flex flex-col items-center min-w-[210px] max-w-[260px] mx-auto">
                  <img src={card.images.small} alt={card.name} className="w-40 h-56 object-contain mb-1" />
                  <div className="font-semibold text-gray-800 text-center">{card.name}</div>
                  <div className="text-xs text-gray-500 text-center">{card.set.name}</div>
                  <div className="text-xs text-gray-400 text-center">{card.set.series}</div>
                  {user && (
                    <button
                      className="mt-2 text-pink-500"
                      onClick={() => handleLike(card)}
                      disabled={liking === card.id}
                      aria-label="Remove from wishlist"
                    >
                      <HeartSolid className="w-6 h-6" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
} 