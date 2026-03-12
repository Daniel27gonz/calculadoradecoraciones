import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Hotmart events that trigger cancellation
const CANCELLATION_EVENTS = [
  'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK',
  'PURCHASE_EXPIRED',
  'SUBSCRIPTION_CANCELLATION',
  'PURCHASE_CANCELED',
  'PURCHASE_PROTEST',
  'PURCHASE_DELAYED',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()

    // Log the full payload for debugging
    console.log('Cancel webhook payload received:', JSON.stringify(body, null, 2))

    // Validate webhook token
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    const url = new URL(req.url)
    const receivedToken = 
      url.searchParams.get('token') ||
      body.hottok ||
      body.token || 
      body.api_token || 
      body.secret || 
      body.webhook_token ||
      req.headers.get('x-hotmart-hottok') ||
      req.headers.get('x-webhook-token') || 
      req.headers.get('authorization')

    console.log('Token validation:', { receivedToken: receivedToken ? 'present' : 'missing', matches: receivedToken === webhookSecret })

    if (!webhookSecret || receivedToken !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid or missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract event type and email from Hotmart payload
    const event = body.event || body.status || body.type
    const email = body.email || body.data?.buyer?.email || body.buyer?.email || body.customer?.email

    console.log('Event:', event, '| Email:', email)

    if (!event) {
      return new Response(
        JSON.stringify({ error: 'Event type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if event is a cancellation event
    if (!CANCELLATION_EVENTS.includes(event)) {
      console.log('Event not a cancellation type, ignoring:', event)
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored, not a cancellation type', event }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Find the user by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const user = existingUsers?.users?.find(u => u.email === email)

    if (!user) {
      console.log('User not found for email:', email)
      return new Response(
        JSON.stringify({ error: 'User not found', email }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update approval status to rejected and set cancellation date
    const { error: updateError } = await supabaseAdmin
      .from('user_approval_status')
      .update({
        status: 'rejected',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating user status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to cancel user access', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User access cancelled:', user.id, '| Event:', event)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User access cancelled successfully',
        user_id: user.id,
        event,
        cancelled_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
