import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Log des variables d'environnement (masquées)
console.log('Webhook Config:', {
  hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
  hasWebhookSecret: !!webhookSecret,
  hasServiceRoleKey: !!supabaseServiceRoleKey,
  hasSupabaseUrl: !!supabaseUrl,
});

const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: Request) {
  console.log('Webhook called - START');
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    console.log('Webhook headers:', {
      signature: signature.substring(0, 10) + '...',
      contentType: req.headers.get('content-type'),
    });

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('Stripe webhook event:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
    });

    // Gérer les différents événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing checkout.session.completed:', {
          sessionId: session.id,
          customerId: session.customer,
          userId: session.metadata?.user_id,
          paymentStatus: session.payment_status,
          subscriptionStatus: session.status,
          subscriptionId: session.subscription,
        });

        const userId = session.metadata?.user_id;
        const stripeCustomerId = session.customer?.toString() || null;
        const stripeSubscriptionId = session.subscription?.toString() || null;

        if (!userId) {
          console.error('No user ID in session metadata');
          throw new Error('No user ID in session metadata');
        }

        // Vérifier si l'utilisateur existe déjà dans user_subscriptions
        console.log('Checking existing subscription for user:', userId);
        const { data: existingSubscription, error: fetchError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
          console.error('Error fetching existing subscription:', fetchError);
          throw fetchError;
        }

        console.log('Existing subscription:', existingSubscription);

        const now = new Date().toISOString();

        // Créer ou mettre à jour l'abonnement
        console.log('Upserting subscription with data:', {
          userId,
          stripeCustomerId,
          stripeSubscriptionId,
          now,
        });

        const { data: subscription, error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            status: 'active',
            subscription_type: 'premium',
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            start_date: now,
            end_date: null, // Abonnement actif jusqu'à annulation
            updated_at: now,
            created_at: existingSubscription ? existingSubscription.created_at : now,
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase upsert error:', error);
          throw error;
        }

        console.log('Premium subscription created/updated:', subscription);
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Processing subscription update:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          userId: subscription.metadata?.user_id,
          status: subscription.status,
        });

        const userId = subscription.metadata?.user_id;
        let targetUserId = userId;

        if (!userId) {
          console.log('No user ID in subscription metadata, looking up by customer ID');
          // Chercher l'utilisateur par l'ID client Stripe
          const { data: subscriptionData, error } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', subscription.customer)
            .single();

          if (error || !subscriptionData) {
            console.error('No subscription found for this customer', error);
            throw new Error('No subscription found for this customer');
          }
          targetUserId = subscriptionData.user_id;
          console.log('Found user ID:', targetUserId);
        }

        const now = new Date().toISOString();

        console.log('Updating subscription for user:', targetUserId);
        // Mettre à jour le statut de l'abonnement
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 'cancelled',
            subscription_type: 'premium',
            end_date: subscription.status === 'active' ? null : now,
            updated_at: now,
          })
          .eq('user_id', targetUserId);

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        console.log('Subscription updated successfully for user:', targetUserId);
        break;
      }
    }

    console.log('Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: err.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 