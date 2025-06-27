import { loadStripe } from '@stripe/stripe-js';

// Log pour vérifier la clé publique (masquée)
console.log('Stripe Client Config:', {
  hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 8),
});

// Fonction pour charger Stripe avec gestion d'erreur
const getStripe = async () => {
  try {
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    if (!stripe) {
      throw new Error('Failed to initialize Stripe. Please check your ad blocker settings.');
    }
    console.log('Stripe loaded successfully');
    return stripe;
  } catch (error) {
    console.error('Error loading Stripe:', error);
    throw new Error('Failed to load Stripe. Please disable your ad blocker for this site.');
  }
};

export default getStripe; 