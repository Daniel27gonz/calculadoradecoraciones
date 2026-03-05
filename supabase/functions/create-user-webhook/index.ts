import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

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
    console.log('Webhook payload received:', JSON.stringify(body, null, 2))

    // Validate webhook token
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    const token = body.token || body.api_token || body.secret || body.webhook_token
    const tokenFromHeader = req.headers.get('x-webhook-token') || req.headers.get('authorization')

    const receivedToken = token || tokenFromHeader
    console.log('Token validation:', { receivedToken: receivedToken ? 'present' : 'missing', matches: receivedToken === webhookSecret })

    if (!webhookSecret || receivedToken !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid or missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract email and phone from webhook payload
    const email = body.email || body.customer?.email
    const phone = body.phone || body.telephone || body.cel || body.customer?.phone || body.customer?.telephone || body.customer?.cel

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean phone: keep only digits
    const cleanPhone = phone.replace(/\D/g, '')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.find(u => u.email === email)

    if (userExists) {
      console.log('User already exists:', userExists.id)
      return new Response(
        JSON.stringify({ success: true, message: 'User already exists', user_id: userExists.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user with email and phone as temporary password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: cleanPhone,
      email_confirm: true,
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Auto-approve the user
    await supabaseAdmin
      .from('user_approval_status')
      .update({ status: 'approved' })
      .eq('user_id', newUser.user.id)

    console.log('User created and approved:', newUser.user.id)

    return new Response(
      JSON.stringify({ success: true, message: 'User created successfully', user_id: newUser.user.id }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
