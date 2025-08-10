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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get or create Stripe customer
    let stripeCustomerId: string
    
    // First, check if user already has a Stripe customer ID
    const { data: userData, error: fetchError } = await supabaseClient
      .from('users')
      .select('stripe_customer_id, email, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching user data:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (userData.stripe_customer_id) {
      stripeCustomerId = userData.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email || user.email,
        name: userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}` 
          : user.email?.split('@')[0] || 'Student',
        metadata: {
          supabase_user_id: user.id,
          plan_type: 'student',
        },
      })

      stripeCustomerId = customer.id

      // Save Stripe customer ID to database
      await supabaseClient
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    // Get the app's base URL for redirects (handle Northflank domains)
    const origin = req.headers.get('origin') || 'https://localhost:3000'
    
    // Create Stripe Checkout session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'ScheduleBud Pro - Student Plan',
              description: 'Unlimited AI assistance, advanced analytics, and priority support for students',
              images: [`${origin}/logo192.png`],
            },
            unit_amount: 500, // $5.00 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription/cancel`,
      // 7-day free trial
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: user.id,
          plan_type: 'student_pro',
        },
      },
      // Customer portal configuration
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      // Student-friendly payment descriptions
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: 'ScheduleBud Pro - Academic Productivity Tools',
          metadata: {
            student_plan: 'true',
          },
        },
      },
      // Allow promotion codes for student discounts
      allow_promotion_codes: true,
      // Set payment behavior for better trial experience
      payment_method_collection: 'if_required',
    })

    // Update user status to indicate trial will start
    await supabaseClient
      .from('users')
      .update({ 
        subscription_status: 'trialing',
        trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .eq('id', user.id)

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})