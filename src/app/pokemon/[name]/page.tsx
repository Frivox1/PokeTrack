'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import axios from 'axios';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCardCollection } from '@/hooks/useCardCollection';
import Image from 'next/image';

interface PokemonCard {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  set: {
    name: string;
    series: string;
  };
}

interface PageProps {
  params: Promise<{ name: string }>;
}

export default function PokemonCardsPage({ params }: PageProps) {
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<HTMLDivElement | null>(null);
  const resolvedParams = use(params);
  const pokemonName = decodeURIComponent(resolvedParams.name);

  const router = useRouter();
  const { user } = useAuth();
  const { hasCard, toggleCard } = useCardCollection();

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
        headers: {
          'X-Api-Key': process.env.NEXT_PUBLIC_POKEMON_API_KEY
        },
        params: {
          q: `name:\"${pokemonName}\"`,
          orderBy: '-set.releaseDate',
          pageSize: 8,
          page: page
        }
      });

      const newCards = response.data.data;
      setCards((prev) => [...prev, ...newCards]);
      setHasMore(newCards.length > 0);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pokemonName]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Intersection observer
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loading]);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-700 hover:text-gray-900 group"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            <span className="group-hover:underline">Back to Pokédex</span>
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-700 mb-8">{pokemonName} Cards</h1>

        {cards.length === 0 && !loading ? (
          <div className="text-center text-gray-700">No cards found for {pokemonName}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => {
              const owned = hasCard(card.id);
              const uniqueKey = `${card.id}-${index}`;

              return (
                <div key={uniqueKey} className="relative bg-white rounded-lg shadow-md overflow-hidden p-4 flex flex-col">
                  <div className="mb-2 w-full flex justify-center">
                    <Image
                      src={card.images.large}
                      alt={`${card.name} from ${card.set.name}`}
                      width={250}
                      height={350}
                      loading="lazy"
                      className="object-contain rounded-md"
                    />
                  </div>
                  <div className="p-2 pt-0 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{card.set.name}</h3>
                      <p className="text-sm text-gray-500">{card.set.series}</p>
                    </div>
                    {user && (
                      <button
                        onClick={() => toggleCard(`${card.id}`, card.set.name, card.set.series, card.name)}
                        className="ml-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors duration-200"
                      >
                        <CheckIcon
                          className="h-7 w-7"
                          style={{
                            color: 'white',
                            stroke: owned ? '#22c55e' : '#d1d5db',
                            strokeWidth: 2.5,
                          }}
                        />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sentinel pour charger plus */}
        {hasMore && (
          <div ref={observerRef} className="h-16 flex justify-center items-center">
            {loading && <span className="text-gray-600">Loading more cards...</span>}
          </div>
        )}
      </div>
    </main>
  );
}