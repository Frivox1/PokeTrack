import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface GenerationSelectorProps {
  currentGeneration: number;
  onGenerationChange: (generation: number) => void;
  onRefresh?: () => void;
  loading?: boolean;
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
}

const generations = [
  { number: 1, range: "1-151", name: "Kanto" },
  { number: 2, range: "152-251", name: "Johto" },
  { number: 3, range: "252-386", name: "Hoenn" },
  { number: 4, range: "387-493", name: "Sinnoh" },
  { number: 5, range: "494-649", name: "Unova" },
  { number: 6, range: "650-721", name: "Kalos" },
  { number: 7, range: "722-809", name: "Alola" },
  { number: 8, range: "810-905", name: "Galar" },
  { number: 9, range: "906-1025", name: "Paldea" },
];

export default function GenerationSelector({ currentGeneration, onGenerationChange, onRefresh, loading, searchTerm, setSearchTerm }: GenerationSelectorProps) {
  const handlePrevious = () => {
    if (currentGeneration > 1) {
      onGenerationChange(currentGeneration - 1);
    }
  };

  const handleNext = () => {
    if (currentGeneration < generations.length) {
      onGenerationChange(currentGeneration + 1);
    }
  };

  const currentGen = generations.find(gen => gen.number === currentGeneration);

  return (
    <div className="flex items-center justify-center gap-4 mb-8 w-full">
      <button
        onClick={handlePrevious}
        disabled={currentGeneration === 1}
        className={`p-2 rounded-full ${
          currentGeneration === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      <div className="flex items-center gap-2 text-xl font-semibold text-gray-700">
        <span>
          Génération {currentGen?.number} - {currentGen?.name}
          <div className="text-sm text-gray-500 text-center">
            Pokémon {currentGen?.range}
          </div>
        </span>
        {typeof onRefresh === 'function' && (
          <button
            onClick={onRefresh}
            className="ml-2 p-2 rounded-full border border-blue-500 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Refresh collection"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8h4z" />
              </svg>
            ) : (
              <ArrowPathIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      <button
        onClick={handleNext}
        disabled={currentGeneration === generations.length}
        className={`p-2 rounded-full ${
          currentGeneration === generations.length
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>
    </div>
  );
} 