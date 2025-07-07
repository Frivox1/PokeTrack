'use client';

import { useState, useEffect, useMemo } from 'react';
import PokemonCard from '@/components/PokemonCard';
import GenerationSelector from '@/components/GenerationSelector';
import { POKEMONS } from '@/data/pokemon';
import { useCardCollection } from '@/hooks/useCardCollection';
import { cleanPokemonName } from '@/utils/cleanPokemonName';

const generationRanges: Record<number, [number, number]> = {
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493],
  5: [494, 649],
  6: [650, 721],
  7: [722, 809],
  8: [810, 905],
  9: [906, 1025],
};

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentGeneration, setCurrentGeneration] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const { reloadCollection, collection } = useCardCollection();

  useEffect(() => {
    reloadCollection(); // Chargement initial
  }, []);

  const filterByGeneration = (generation: number) => {
    const [start, end] = generationRanges[generation] ?? [1, 151];
    return POKEMONS.filter(p => p.id >= start && p.id <= end);
  };

  const collectedPokemon = useMemo(() => {
    return new Set(
      Array.from(collection).map(item => cleanPokemonName(item.pokemon_name))
    );
  }, [collection]);

  const filteredPokemon = useMemo(() => {
    return searchTerm
      ? POKEMONS.filter(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toString().includes(searchTerm)
        )
      : filterByGeneration(currentGeneration);
  }, [searchTerm, currentGeneration, collectedPokemon]);

  const handleGenerationChange = async (generation: number) => {
    setRefreshing(true);
    setCurrentGeneration(generation);
    await reloadCollection(true);
    setRefreshing(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await reloadCollection(true);
    setRefreshing(false);
  };

  const ownedCount = collectedPokemon.size;
  const totalCount = 1025;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Barre de recherche & Générations */}
        <div className="mb-8 w-full">
          {/* Mobile */}
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

          {/* Desktop */}
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Affichage des cartes */}
        {refreshing ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-xl text-gray-700">Loading collection...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredPokemon.map(pokemon => (
              <PokemonCard
                key={pokemon.id}
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