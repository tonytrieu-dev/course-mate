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

    // Parse request body to get billing plan
    const { plan = 'monthly' } = await req.json().catch(() => ({}))
    
    // Academic calendar helper functions
    const getAcademicYear = (date: Date = new Date(), system: 'semester' | 'quarter' = 'semester') => {
      const year = date.getFullYear()
      const month = date.getMonth() + 1 // JavaScript months are 0-based
      
      if (system === 'semester') {
        // Semester system: August-May (10 months)
        if (month >= 8) {
          return { start: year, end: year + 1, system: 'semester' }
        } else {
          return { start: year - 1, end: year, system: 'semester' }
        }
      } else {
        // Quarter system: September-June (9 months) 
        if (month >= 9) {
          return { start: year, end: year + 1, system: 'quarter' }
        } else {
          return { start: year - 1, end: year, system: 'quarter' }
        }
      }
    }
    
    const getAcademicYearDates = (academicYear = getAcademicYear()) => {
      if (academicYear.system === 'semester') {
        return {
          start: new Date(academicYear.start, 7, 1), // August 1st
          end: new Date(academicYear.end, 4, 31), // May 31st
          months: 10,
          system: 'semester'
        }
      } else {
        return {
          start: new Date(academicYear.start, 8, 1), // September 1st
          end: new Date(academicYear.end, 5, 30), // June 30th
          months: 9,
          system: 'quarter'
        }
      }
    }
    
    const calculateAcademicProration = (startDate: Date = new Date(), system: 'semester' | 'quarter' = 'semester') => {
      const academicYear = getAcademicYear(startDate, system)
      const yearInfo = getAcademicYearDates(academicYear)
      const { start: yearStart, end: yearEnd, months: totalMonths } = yearInfo
      
      // If we're past the academic year end, start billing for next academic year
      if (startDate > yearEnd) {
        const nextYearStart = system === 'semester' 
          ? new Date(startDate.getFullYear(), 7, 1) // August 1st
          : new Date(startDate.getFullYear(), 8, 1)  // September 1st
        const nextYear = getAcademicYear(nextYearStart, system)
        const nextYearInfo = getAcademicYearDates(nextYear)
        
        return {
          academicYear: nextYear,
          ...nextYearInfo,
          monthsRemaining: totalMonths,
          prorationFactor: 1.0
        }
      }
      
      // Calculate months remaining in current academic year
      const startMonth = startDate.getMonth() + 1
      const endMonth = yearEnd.getMonth() + 1
      
      let monthsRemaining: number
      
      if (system === 'semester') {
        // Semester system: August-May (10 months)
        if (startMonth <= 5) {
          // January-May: count from current month to May
          monthsRemaining = 5 - startMonth + 1
        } else if (startMonth >= 8) {
          // August-December: count remaining months in year + Jan-May
          monthsRemaining = (12 - startMonth + 1) + 5
        } else {
          // June-July: start next academic year
          const nextYear = getAcademicYear(new Date(startDate.getFullYear(), 7, 1), system)
          const nextYearInfo = getAcademicYearDates(nextYear)
          return {
            academicYear: nextYear,
            ...nextYearInfo,
            monthsRemaining: 10,
            prorationFactor: 1.0
          }
        }
      } else {
        // Quarter system: September-June (9 months)  
        if (startMonth <= 6) {
          // January-June: count from current month to June
          monthsRemaining = 6 - startMonth + 1
        } else if (startMonth >= 9) {
          // September-December: count remaining months in year + Jan-June
          monthsRemaining = (12 - startMonth + 1) + 6
        } else {
          // July-August: start next academic year
          const nextYear = getAcademicYear(new Date(startDate.getFullYear(), 8, 1), system)
          const nextYearInfo = getAcademicYearDates(nextYear)
          return {
            academicYear: nextYear,
            ...nextYearInfo,
            monthsRemaining: 9,
            prorationFactor: 1.0
          }
        }
      }
      
      // Ensure months remaining is within valid range
      monthsRemaining = Math.max(1, Math.min(totalMonths, monthsRemaining))
      const prorationFactor = monthsRemaining / totalMonths
      
      return {
        academicYear,
        ...yearInfo,
        monthsRemaining,
        prorationFactor
      }
    }
    
    // TODO: Detect academic system from user email domain or preference
    // For now, default to semester system (more common)
    const academicSystem = 'semester' // Could be enhanced to detect from user data
    
    // Calculate academic year proration for academic plan
    const academicInfo = plan === 'academic' ? calculateAcademicProration(new Date(), academicSystem) : null
    const basePrice = academicSystem === 'semester' ? 3000 : 2700 // $30 for 10 months, $27 for 9 months
    const academicAmount = academicInfo ? Math.round(basePrice * academicInfo.prorationFactor) : basePrice
    
    // Plan configuration
    const planConfigs = {
      monthly: {
        amount: 499, // $4.99
        interval: 'month',
        name: 'ScheduleBud Pro - Student Plan (Monthly)',
        description: 'Monthly subscription with unlimited AI assistance and advanced analytics'
      },
      annual: {
        amount: 3600, // $36.00 ($3/month)
        interval: 'year', 
        name: 'ScheduleBud Pro - Student Plan (Annual)',
        description: 'Annual subscription - save 40% with yearly billing'
      },
      academic: {
        amount: academicAmount,
        interval: 'month',
        interval_count: academicInfo?.monthsRemaining || 9,
        name: 'ScheduleBud Pro - Academic Year Plan', 
        description: academicInfo?.monthsRemaining === academicInfo?.months
          ? `Pay for school year only (${academicSystem === 'semester' ? 'August-May' : 'September-June'}) - no summer charges`
          : `Pro-rated for ${academicInfo?.monthsRemaining} remaining months in ${academicSystem} system`
      }
    }
    
    const selectedPlan = planConfigs[plan] || planConfigs.monthly

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
    
    // Build recurring object based on plan type
    const recurringConfig = selectedPlan.interval_count 
      ? { interval: selectedPlan.interval, interval_count: selectedPlan.interval_count }
      : { interval: selectedPlan.interval }
    
    // Create Stripe Checkout session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
              images: [`${origin}/logo192.png`],
            },
            unit_amount: selectedPlan.amount,
            recurring: recurringConfig,
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
          billing_cycle: plan,
          plan_amount: selectedPlan.amount.toString(),
          ...(academicInfo && {
            academic_year_start: academicInfo.academicYear.start.toString(),
            academic_year_end: academicInfo.academicYear.end.toString(),
            months_remaining: academicInfo.monthsRemaining.toString(),
            proration_factor: academicInfo.prorationFactor.toString(),
          }),
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
    const updateData: any = { 
      subscription_status: 'trialing',
      trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      billing_cycle: plan,
      plan_amount: selectedPlan.amount,
    }
    
    // Add academic year data if applicable
    if (academicInfo) {
      updateData.academic_year_start = academicInfo.start.toISOString()
      updateData.academic_year_end = academicInfo.end.toISOString()
      updateData.months_remaining = academicInfo.monthsRemaining
    }
    
    await supabaseClient
      .from('users')
      .update(updateData)
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