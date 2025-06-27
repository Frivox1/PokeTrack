'use client';

import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSearch } from '@/context/SearchContext';
import { useAuth } from '@/context/AuthContext';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { searchTerm, setSearchTerm } = useSearch();
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, [setSearchTerm]);

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-extrabold text-gray-700 tracking-tight cursor-pointer select-none">PokeTrack</span>
            </Link>

            {/* Desktop Right section */}
            <div className="hidden md:flex items-center gap-4">
              {/* Auth buttons */}
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href="/profile">
                    <span className="text-lg text-blue-600 hover:underline cursor-pointer font-semibold">My profile</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-md font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/signup">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">Sign up</span>
                  </Link>
                  <Link href="/login">
                    <span className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Login</span>
                  </Link>
                </>
              )}
            </div>

            {/* Burger menu button (mobile) */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 focus:outline-none"
                aria-label="Menu"
              >
                {menuOpen ? (
                  <XMarkIcon className="h-7 w-7" />
                ) : (
                  <Bars3Icon className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white shadow-lg border-t border-gray-100 px-4 pb-4 pt-2">
            {/* Auth buttons */}
            {user ? (
              <div className="flex flex-col gap-2">
                <Link href="/profile">
                  <span className="text-md text-blue-600 hover:underline cursor-pointer">My profile</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-gray-900 hover:underline px-3 py-2 rounded-md text-sm font-medium text-left">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/signup">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-md text-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-left cursor-pointer">Sign up</span>
                </Link>
                <Link href="/login">
                  <span className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-medium text-left cursor-pointer">Login</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
} 