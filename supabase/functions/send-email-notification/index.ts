import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailNotificationRequest {
  user_id: string;
  task_id: number; // Changed to number to match bigint in database
  email_type: 'assignment_reminder' | 'new_assignment' | 'urgent_deadline';
  task_title: string;
  task_class?: string;
  due_date: string;
  due_time?: string;
  priority?: 'low' | 'medium' | 'high';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { 
      user_id, 
      task_id, 
      email_type, 
      task_title, 
      task_class, 
      due_date, 
      due_time, 
      priority 
    }: EmailNotificationRequest = await req.json()

    // Get user's notification settings
    const { data: notificationSettings, error: settingsError } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .eq('user_id', user_id)
      .eq('email_enabled', true)
      .single()

    if (settingsError || !notificationSettings) {
      console.log('No notification settings found or email disabled for user:', user_id, settingsError)
      return new Response(
        JSON.stringify({ error: 'Email notifications not enabled for user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's email from auth if no custom email is set
    let emailAddress = notificationSettings.email_address
    
    if (!emailAddress) {
      const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(user_id)
      if (userError || !userData.user?.email) {
        console.log('Could not get user email:', userError)
        return new Response(
          JSON.stringify({ error: 'No email address found for user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      emailAddress = userData.user.email
    }
    
    if (!emailAddress) {
      return new Response(
        JSON.stringify({ error: 'No email address found for user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if we already sent this notification today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingNotification } = await supabaseClient
      .from('email_notifications')
      .select('id')
      .eq('user_id', user_id)
      .eq('task_id', task_id)
      .eq('email_type', email_type)
      .gte('sent_at', `${today}T00:00:00.000Z`)
      .limit(1)

    if (existingNotification && existingNotification.length > 0) {
      console.log('Notification already sent today for:', { user_id, task_id, email_type })
      return new Response(
        JSON.stringify({ message: 'Notification already sent today' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate email content
    const { subject, htmlContent, textContent } = generateEmailContent({
      email_type,
      task_title,
      task_class,
      due_date,
      due_time,
      priority,
      task_id
    })

    // Check if Brevo API key is available
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    console.log('Brevo API key exists:', !!brevoApiKey)
    console.log('Brevo API key starts with xkeysib-:', brevoApiKey?.startsWith('xkeysib-'))
    
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY environment variable is not set')
      throw new Error('BREVO_API_KEY not configured')
    }

    // Send email via Brevo (Sendinblue)
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'CourseMate',
          email: 'coursemate.notifications@gmail.com'
        },
        to: [
          {
            name: '',
            email: emailAddress
          }
        ],
        subject: subject,
        htmlContent: htmlContent,
        textContent: textContent,
        tags: ['notification', email_type]
      }),
    })

    const brevoData = await brevoResponse.json()
    console.log('Brevo response status:', brevoResponse.status)
    console.log('Brevo response data:', brevoData)

    if (!brevoResponse.ok) {
      console.error('Brevo API error:', brevoData)
      throw new Error(`Brevo API error: ${brevoData.message || JSON.stringify(brevoData)}`)
    }

    // Log the sent notification
    const { error: logError } = await supabaseClient
      .from('email_notifications')
      .insert({
        user_id,
        task_id,
        email_type,
        email_address: emailAddress,
        subject,
        message_id: brevoData.messageId || 'brevo-' + Date.now(),
        sent_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging notification:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: brevoData.messageId || 'brevo-' + Date.now(),
        email_address: emailAddress 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-email-notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateEmailContent({
  email_type,
  task_title,
  task_class,
  due_date,
  due_time,
  priority,
  task_id
}: {
  email_type: string;
  task_title: string;
  task_class?: string;
  due_date: string;
  due_time?: string;
  priority?: string;
  task_id: string;
}) {
  const dueDateTime = new Date(due_date + (due_time ? `T${due_time}` : 'T23:59:59'))
  const dueDateFormatted = dueDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const dueTimeFormatted = due_time ? 
    dueDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 
    'End of day'

  const classInfo = task_class ? ` for ${task_class}` : ''
  const priorityEmoji = priority === 'high' ? '🚨' : priority === 'medium' ? '⚠️' : '📋'

  let subject = ''
  let greeting = ''
  let urgencyMessage = ''

  switch (email_type) {
    case 'urgent_deadline':
      subject = `🚨 URGENT: "${task_title}" due soon!`
      greeting = 'Hey there! Time-sensitive reminder:'
      urgencyMessage = 'This assignment is due very soon. Don\'t let it slip by!'
      break
    case 'assignment_reminder':
      subject = `${priorityEmoji} Reminder: "${task_title}" due ${dueDateFormatted}`
      greeting = 'Friendly reminder from your student planner:'
      urgencyMessage = 'Stay on top of your assignments and keep that GPA strong! 💪'
      break
    case 'new_assignment':
      subject = `📚 New Assignment: "${task_title}"${classInfo}`
      greeting = 'New assignment detected from Canvas:'
      urgencyMessage = 'Get ahead of the curve by planning your time now!'
      break
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .assignment-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .due-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #eee; }
        .emoji { font-size: 1.2em; }
        @media (max-width: 600px) { .container { margin: 0; border-radius: 0; } .header, .content { padding: 20px 15px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">${priorityEmoji} Student Planner</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Built for students, by a student</p>
        </div>
        
        <div class="content">
          <p style="font-size: 16px; margin-bottom: 20px;">${greeting}</p>
          
          <div class="assignment-card">
            <h2 style="margin: 0 0 10px 0; color: #333; font-size: 20px;">${task_title}</h2>
            ${task_class ? `<p style="margin: 5px 0; color: #666; font-weight: 500;">📚 ${task_class}</p>` : ''}
            ${priority ? `<p style="margin: 5px 0; color: #666;">Priority: <span style="font-weight: bold; color: ${priority === 'high' ? '#e74c3c' : priority === 'medium' ? '#f39c12' : '#27ae60'}">${priority.toUpperCase()}</span></p>` : ''}
          </div>
          
          <div class="due-info">
            <h3 style="margin: 0 0 10px 0; color: #856404;">⏰ Due Date & Time</h3>
            <p style="margin: 0; font-size: 16px; font-weight: bold;">${dueDateFormatted} at ${dueTimeFormatted}</p>
          </div>
          
          <p style="font-size: 16px; color: #667eea; font-weight: 500;">${urgencyMessage}</p>
          
          <div style="text-align: center; margin: 30px 0;">
            ${task_id === -1 ? 
              '<p style="color: #667eea; font-weight: 500;">✅ This is a test email - no action needed!</p>' : 
              `<a href="https://coursemate.com/tasks/${task_id}" class="cta-button">View Assignment Details</a>`
            }
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            💡 <strong>Pro tip:</strong> Check off assignments as you complete them to stay organized and motivated!
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;">You're receiving this because you enabled email notifications.</p>
          <p style="margin: 0; font-size: 12px;">
            <a href="https://coursemate.com/settings/notifications" style="color: #667eea;">Manage notification preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
${subject}

${greeting}

Assignment: ${task_title}${classInfo}
${priority ? `Priority: ${priority.toUpperCase()}` : ''}

Due: ${dueDateFormatted} at ${dueTimeFormatted}

${urgencyMessage}

${task_id === -1 ? 'This is a test email - no action needed!' : `View assignment details: https://coursemate.com/tasks/${task_id}`}

---
Built for students, by a student
Manage notification preferences: https://coursemate.com/settings/notifications
  `

  return { subject, htmlContent, textContent }
}