import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Card {
  card_id: string;
  pokemon_name: string;
  set_name: string;
  series: string;
  created_at: string;
}

interface MyCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Set<Card>;
}

export default function MyCardsModal({ isOpen, onClose, collection }: MyCardsModalProps) {
  const [search, setSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Liste des sets uniques pour le select
  const setOptions = Array.from(new Set(Array.from(collection).map(card => card.set_name))).sort();

  let filteredCards = Array.from(collection)
    .filter(card =>
      (!search || card.pokemon_name.toLowerCase().includes(search.toLowerCase())) &&
      (!selectedSet || card.set_name === selectedSet)
    )
    .sort((a, b) => {
      if (sortOrder === 'desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-auto p-6 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <Dialog.Title className="text-2xl font-bold mb-6 text-center">My Cards</Dialog.Title>
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-center">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <select
              value={selectedSet}
              onChange={e => setSelectedSet(e.target.value)}
              className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All sets</option>
              {setOptions.map(set => (
                <option key={set} value={set}>{set}</option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
          {filteredCards.length === 0 ? (
            <div className="text-center text-gray-500">You don't have any cards yet.</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 font-semibold text-gray-700">Pokémon</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Set</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Series</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map((card, idx) => (
                    <tr key={card.card_id} className={`border-b border-gray-200 hover:bg-gray-200 ${idx % 2 === 1 ? 'bg-gray-100' : ''}`}>
                      <td className="py-2 px-3">{card.pokemon_name}</td>
                      <td className="py-2 px-3">{card.set_name}</td>
                      <td className="py-2 px-3">{card.series}</td>
                      <td className="py-2 px-3 text-gray-400">{card.created_at ? new Date(card.created_at).toLocaleDateString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
} 