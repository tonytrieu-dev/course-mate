import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client with service role key for database updates
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret')
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    let event: Stripe.Event

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log(`Processing webhook event: ${event.type}`)

    // Helper function to get user ID from Stripe metadata
    const getUserIdFromEvent = (eventObject: any): string | null => {
      return eventObject.metadata?.supabase_user_id || null
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        {
          const subscription = event.data.object as Stripe.Subscription
          const userId = getUserIdFromEvent(subscription)
          
          if (userId) {
            const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
            
            await supabaseClient
              .from('users')
              .update({
                subscription_status: subscription.trial_end ? 'trialing' : 'active',
                trial_end_date: trialEnd?.toISOString(),
                subscription_created_at: new Date().toISOString(),
              })
              .eq('id', userId)
            
            console.log(`Subscription created for user ${userId}, status: ${subscription.trial_end ? 'trialing' : 'active'}`)
          }
        }
        break

      case 'customer.subscription.trial_will_end':
        {
          const subscription = event.data.object as Stripe.Subscription
          const userId = getUserIdFromEvent(subscription)
          
          if (userId) {
            // Trial is ending soon - could trigger email notification here
            console.log(`Trial ending soon for user ${userId}`)
            
            // Optional: Update a flag to show trial ending warning in UI
            await supabaseClient
              .from('users')
              .update({
                // Could add a trial_ending_soon flag if needed
              })
              .eq('id', userId)
          }
        }
        break

      case 'invoice.payment_succeeded':
        {
          const invoice = event.data.object as Stripe.Invoice
          
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
            const userId = getUserIdFromEvent(subscription)
            
            if (userId) {
              // Payment succeeded - activate subscription
              await supabaseClient
                .from('users')
                .update({
                  subscription_status: 'active',
                  subscription_created_at: subscription.trial_end ? new Date().toISOString() : undefined,
                })
                .eq('id', userId)
              
              console.log(`Payment succeeded for user ${userId}, subscription activated`)
            }
          }
        }
        break

      case 'invoice.payment_failed':
        {
          const invoice = event.data.object as Stripe.Invoice
          
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
            const userId = getUserIdFromEvent(subscription)
            
            if (userId) {
              // Payment failed - could trigger retry logic or notifications
              console.log(`Payment failed for user ${userId}`)
              
              // Subscription status will be handled by Stripe's retry logic
              // We don't immediately cancel - let Stripe handle retries
            }
          }
        }
        break

      case 'customer.subscription.updated':
        {
          const subscription = event.data.object as Stripe.Subscription
          const userId = getUserIdFromEvent(subscription)
          
          if (userId) {
            let status = 'active'
            
            // Map Stripe subscription status to our status
            switch (subscription.status) {
              case 'active':
                status = 'active'
                break
              case 'trialing':
                status = 'trialing'
                break
              case 'past_due':
              case 'unpaid':
                status = 'active' // Keep active during payment issues - Stripe handles retries
                break
              case 'canceled':
              case 'incomplete_expired':
                status = 'canceled'
                break
              default:
                status = 'free'
            }
            
            const updateData: any = { subscription_status: status }
            
            // If subscription was canceled, record the cancellation date
            if (status === 'canceled') {
              updateData.subscription_canceled_at = new Date().toISOString()
            }
            
            await supabaseClient
              .from('users')
              .update(updateData)
              .eq('id', userId)
            
            console.log(`Subscription updated for user ${userId}, new status: ${status}`)
          }
        }
        break

      case 'customer.subscription.deleted':
        {
          const subscription = event.data.object as Stripe.Subscription
          const userId = getUserIdFromEvent(subscription)
          
          if (userId) {
            // Subscription canceled
            await supabaseClient
              .from('users')
              .update({
                subscription_status: 'canceled',
                subscription_canceled_at: new Date().toISOString(),
              })
              .eq('id', userId)
            
            console.log(`Subscription canceled for user ${userId}`)
          }
        }
        break

      case 'checkout.session.completed':
        {
          const session = event.data.object as Stripe.Checkout.Session
          
          if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
            const userId = getUserIdFromEvent(subscription)
            
            if (userId) {
              // Checkout completed successfully
              const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
              
              await supabaseClient
                .from('users')
                .update({
                  subscription_status: subscription.trial_end ? 'trialing' : 'active',
                  trial_end_date: trialEnd?.toISOString(),
                })
                .eq('id', userId)
              
              console.log(`Checkout completed for user ${userId}`)
            }
          }
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})