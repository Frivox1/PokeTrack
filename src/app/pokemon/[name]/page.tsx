'use client';

import { useEffect, useState, use } from 'react';
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
  const router = useRouter();
  const resolvedParams = use(params);
  const pokemonName = decodeURIComponent(resolvedParams.name);
  const { user } = useAuth();
  const { hasCard, toggleCard } = useCardCollection();

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
          headers: {
            'X-Api-Key': process.env.NEXT_PUBLIC_POKEMON_API_KEY
          },
          params: {
            q: `name:\"${pokemonName}\"`,
            orderBy: '-set.releaseDate',
            pageSize: 100
          }
        });

        setCards(response.data.data);
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [pokemonName]);

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

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-xl text-gray-700">Loading cards...</div>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center text-gray-700">
            No cards found for {pokemonName}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cards.map((card) => {
              const owned = hasCard(card.id);
              return (
                <div key={card.id} className="relative bg-white rounded-lg shadow-md overflow-hidden p-4 flex flex-col">
                  {/* Image de la carte */}
                  <div className="relative aspect-[2.5/3.5] mb-2 w-40 sm:w-48 md:w-56 lg:w-full mx-auto">
                    <Image
                      src={card.images.large}
                      alt={`${card.name} from ${card.set.name}`}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Informations de la carte + check aligné à droite */}
                  <div className="p-2 pt-0 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{card.set.name}</h3>
                      <p className="text-sm text-gray-500">{card.set.series}</p>
                    </div>
                    {user && (
                      <button
                        onClick={() => toggleCard(card.id, card.set.name, card.set.series, card.name)}
                        className="ml-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors duration-200"
                      >
                        <CheckIcon
                          className="h-7 w-7"
                          style={{
                            color: 'white',
                            stroke: owned ? '#22c55e' : '#d1d5db', // green-500 or gray-300
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
      </div>
    </main>
  );
} 