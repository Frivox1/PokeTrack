import React, { useState } from 'react';
import PremiumModal from './PremiumModal';

interface PremiumOverlayProps {
  children: React.ReactNode;
  hideButton?: boolean;
}

export default function PremiumOverlay({ children, hideButton = false }: PremiumOverlayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative my-8 flex justify-center">
      <div className="w-full min-h-[250px] flex items-center justify-center">
        <div className="w-full h-[220px] bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="filter blur-xl pointer-events-none w-full h-full flex items-center justify-center">
            {children}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 backdrop-blur-sm rounded-lg">
            <p className="text-xl font-bold text-gray-800 mb-4 text-center">Premium Feature</p>
            {!hideButton && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-auto max-w-xs mx-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>
      </div>
      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
} 