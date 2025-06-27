import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/AuthContext';

interface PokemonCardProps {
  id: string;
  name: string;
  types: string[];
  setName: string;
  series: string;
  hasCard?: boolean;
  _collectionVersion?: number;
}

type PokemonType = 'Grass' | 'Poison' | 'Fire' | 'Flying' | 'Water' | 'Bug' | 'Normal' | 
  'Electric' | 'Ground' | 'Fairy' | 'Fighting' | 'Psychic' | 'Rock' | 'Steel' | 
  'Ice' | 'Ghost' | 'Dragon' | 'Dark';

const typeColors: Record<PokemonType, string> = {
  Grass: 'bg-green-500 text-white',
  Poison: 'bg-purple-500 text-white',
  Fire: 'bg-red-500 text-white',
  Flying: 'bg-sky-400 text-white',
  Water: 'bg-blue-500 text-white',
  Bug: 'bg-lime-500 text-white',
  Normal: 'bg-gray-400 text-white',
  Electric: 'bg-yellow-400 text-black',
  Ground: 'bg-amber-600 text-white',
  Fairy: 'bg-pink-400 text-white',
  Fighting: 'bg-red-600 text-white',
  Psychic: 'bg-pink-500 text-white',
  Rock: 'bg-yellow-700 text-white',
  Steel: 'bg-gray-500 text-white',
  Ice: 'bg-cyan-400 text-black',
  Ghost: 'bg-purple-600 text-white',
  Dragon: 'bg-violet-600 text-white',
  Dark: 'bg-gray-700 text-white'
};

export default function PokemonCard({ id, name, types, setName, series, hasCard = false }: PokemonCardProps) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div 
      onClick={() => router.push(`/pokemon/${encodeURIComponent(name)}`)}
      className="relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-200"
    >
      {/* Image du Pokémon */}
      <div className="relative h-48 bg-gray-100">
        <Image
          src={`/pokemon/${id}.png`}
          alt={name}
          fill
          className="object-contain p-4"
        />
        {/* Checkmark de collection */}
        {user && (
          <span
            className="absolute top-2 right-2 p-1 rounded-full bg-white/80 shadow-sm"
          >
            <CheckIcon
              className="h-6 w-6"
              style={{
                color: 'white',
                stroke: hasCard ? '#22c55e' : '#d1d5db', // green-500 or gray-300
                strokeWidth: 2.5,
              }}
            />
          </span>
        )}
      </div>

      {/* Informations du Pokémon */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
          <span className="text-sm text-gray-500">#{id.padStart(3, '0')}</span>
        </div>

        {/* Types */}
        <div className="flex gap-2">
          {types.map((type) => (
            <span
              key={type}
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                typeColors[type as PokemonType]
              }`}
            >
              {type}
            </span>
          ))}
        </div>

        {/* Set et série */}
        <div className="mt-2 text-sm text-gray-600">
          <p>{setName}</p>
          <p className="text-gray-500">{series}</p>
        </div>
      </div>
    </div>
  );
} 