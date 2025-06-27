import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

export async function POST(request: Request) {
  try {
    // Log des variables d'environnement (masquées)
    console.log('Stripe Config:', {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 8),
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 8),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    });

    // Récupérer le token d'authentification
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No Bearer token found');
      return new NextResponse(
        JSON.stringify({ error: 'Authentication error', details: 'No Bearer token found' }),
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Créer le client Supabase
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    // Vérifier l'authentification avec le token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Authentication error',
          details: authError?.message || 'Invalid token'
        }),
        { status: 401 }
      );
    }

    console.log('Creating Stripe session for user:', {
      userId: user.id,
      userEmail: user.email,
    });

    // Créer une session de paiement Stripe
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Premium Subscription',
              description: 'Accès aux fonctionnalités premium de Pokémon Collection',
            },
            unit_amount: 499,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    });

    console.log('Stripe session created:', {
      sessionId: stripeSession.id,
      successUrl: stripeSession.success_url,
      cancelUrl: stripeSession.cancel_url,
      metadata: stripeSession.metadata,
      subscription: stripeSession.subscription,
    });

    return new NextResponse(
      JSON.stringify({ sessionId: stripeSession.id }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  } catch (error: any) {
    console.error('Detailed error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
    });
    return new NextResponse(
      JSON.stringify({ 
        error: error.message,
        type: error.type,
        code: error.code 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  }
}