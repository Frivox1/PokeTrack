'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-center">
        <div className="flex items-center justify-center">
          <span className="text-9xl font-bold text-gray-800">4</span>
          <div className="w-24 h-24 mx-4 relative">
            <Image
              src="/pokeball.png"
              alt="Pokeball"
              fill
              className="object-contain hover:rotate-180 transition-transform duration-500"
              priority
            />
          </div>
          <span className="text-9xl font-bold text-gray-800">4</span>
        </div>
        <p className="mt-6 text-xl text-gray-600">
        Oops! This Pokémon seems to have used Teleport and got lost...
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 hover:scale-105 transform"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
} 