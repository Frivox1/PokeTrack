import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import getStripe from '@/lib/stripe';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { error } = useSubscription();
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const { user, session } = useAuth();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      if (!user || !session) {
        throw new Error('Please log in to subscribe');
      }

      // Vérifier que la session est valide
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession) {
        console.error('Session validation error:', sessionError);
        throw new Error('Your session has expired. Please log in again.');
      }
      
      // Créer une session de paiement
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout session error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();

      // Initialiser Stripe
      try {
        const stripe = await getStripe();
        if (!stripe) {
          throw new Error('Please disable your ad blocker to proceed with the payment');
        }

        // Rediriger vers Stripe Checkout
        const { error: stripeError } = await stripe.redirectToCheckout({ 
          sessionId: data.sessionId 
        });
        
        if (stripeError) {
          console.error('Stripe redirect error:', stripeError);
          throw stripeError;
        }
      } catch (stripeError: any) {
        console.error('Stripe initialization error:', stripeError);
        throw new Error(stripeError.message || 'Failed to initialize payment. Please disable your ad blocker.');
      }

    } catch (err: any) {
      console.error('Error subscribing:', err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Premium</h3>
          <p className="text-gray-600">Get access to all analytics features and track your collection like never before!</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Detailed collection analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Progress tracking by generation</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Type distribution analysis</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Collection progress over time</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-gray-900 mb-2">4.99€<span className="text-lg text-gray-500">/month</span></div>
          <p className="text-sm text-gray-500">Cancel anytime</p>
        </div>

        {(error || errorMessage) && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error || errorMessage}
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading || !user || !session}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : !user || !session ? 'Please login to subscribe' : 'Upgrade Now'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          By upgrading, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
} 