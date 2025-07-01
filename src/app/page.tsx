'use client';

import { useState, useEffect, useMemo } from 'react';
import PokemonCard from '@/components/PokemonCard';
import GenerationSelector from '@/components/GenerationSelector';
import { POKEMONS } from '@/data/pokemon';
import { useCardCollection } from '@/hooks/useCardCollection';
import { cleanPokemonName } from '@/utils/cleanPokemonName';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentGeneration, setCurrentGeneration] = useState(1);
  const { reloadCollection, collection } = useCardCollection();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    reloadCollection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrer les Pokémon par génération
  const filterByGeneration = (generation: number) => {
    let start = 1;
    let end = 151;

    switch (generation) {
      case 2:
        start = 152;
        end = 251;
        break;
      case 3:
        start = 252;
        end = 386;
        break;
      case 4:
        start = 387;
        end = 493;
        break;
      case 5:
        start = 494;
        end = 649;
        break;
      case 6:
        start = 650;
        end = 721;
        break;
      case 7:
        start = 722;
        end = 809;
        break;
      case 8:
        start = 810;
        end = 905;
        break;
      case 9:
        start = 906;
        end = 1025;
        break;
    }

    return POKEMONS.filter(pokemon => pokemon.id >= start && pokemon.id <= end);
  };

  // Créer un Set des noms de Pokémon nettoyés dans la collection
  const collectedPokemon = useMemo(() => {
    return new Set(Array.from(collection).map(item => cleanPokemonName(item.pokemon_name)));
  }, [collection]);

  // Filtrer les Pokémon par recherche
  const filteredPokemon = useMemo(() => {
    return searchTerm
      ? POKEMONS.filter(pokemon =>
          pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pokemon.id.toString().includes(searchTerm)
        )
      : filterByGeneration(currentGeneration);
  }, [searchTerm, currentGeneration]);

  // Recharge la collection à chaque changement de génération
  const handleGenerationChange = async (generation: number) => {
    setRefreshing(true);
    setCurrentGeneration(generation);
    await reloadCollection(true); // Force le rechargement
    setRefreshing(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await reloadCollection(true);
    setRefreshing(false);
  };

  // Calcul du nombre de Pokémon uniques possédés
  const ownedCount = collectedPokemon.size;
  const totalCount = 1025;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 w-full">
          {/* Mobile: flex-col, Desktop: relative absolute centering */}
          <div className="flex flex-col lg:hidden w-full">
            <div className="w-full max-w-xs mx-auto mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex justify-center w-full">
              <GenerationSelector
                currentGeneration={currentGeneration}
                onGenerationChange={handleGenerationChange}
                onRefresh={handleRefresh}
                loading={refreshing}
              />
            </div>
          </div>
          <div className="hidden lg:block relative h-24 w-full">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <GenerationSelector
                currentGeneration={currentGeneration}
                onGenerationChange={handleGenerationChange}
                onRefresh={handleRefresh}
                loading={refreshing}
              />
            </div>
            <div className="absolute right-0 top-0 h-full flex items-center w-64">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {refreshing ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-xl text-gray-700">Loading collection...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredPokemon.map((pokemon) => (
              <PokemonCard
                key={`${pokemon.id}-${currentGeneration}-${collectedPokemon.has(cleanPokemonName(pokemon.name))}`}
                id={pokemon.id.toString()}
                name={pokemon.name}
                types={pokemon.types}
                setName=""
                series=""
                hasCard={collectedPokemon.has(cleanPokemonName(pokemon.name))}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
