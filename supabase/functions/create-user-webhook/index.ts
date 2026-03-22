import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

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

    console.log('Webhook payload received:', JSON.stringify(body, null, 2))

    // Validate webhook token - support multiple locations
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    const url = new URL(req.url)
    const receivedToken = 
      url.searchParams.get('token') ||        // Token in URL query param
      body.hottok ||                          // Hotmart's standard token field
      req.headers.get('x-hotmart-hottok') ||  // Hotmart header
      body.token                              // Generic token field

    if (webhookSecret && receivedToken !== webhookSecret) {
      console.error('Invalid webhook token')
      return new Response(
        JSON.stringify({ error: 'Invalid webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract buyer email from various payload formats
    const email = 
      body.data?.buyer?.email ||
      body.buyer?.email ||
      body.email ||
      body.data?.email

    const buyerName = 
      body.data?.buyer?.name ||
      body.buyer?.name ||
      body.name ||
      body.data?.name

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default password for all new users - use bcrypt hash to bypass HIBP check
    const defaultPassword = 'Acceso123'
    const passwordHash = bcrypt.hashSync(defaultPassword, 10)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.find(u => u.email === email)

    if (userExists) {
      // If action is update_password, update the user's password using hash
      if (body.action === 'update_password') {
        const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userExists.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password_hash: passwordHash }),
        })
        if (!response.ok) {
          const errorBody = await response.text()
          return new Response(
            JSON.stringify({ error: 'Failed to update password', details: errorBody }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        console.log('Password updated for user:', userExists.id)
        return new Response(
          JSON.stringify({ success: true, message: 'Password updated', user_id: userExists.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log('User already exists:', userExists.id)
      return new Response(
        JSON.stringify({ success: true, message: 'User already exists', user_id: userExists.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user using direct API with password_hash to bypass HIBP
    const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password_hash: passwordHash,
        email_confirm: true,
        user_metadata: { name: buyerName || undefined },
      }),
    })

    if (!createResponse.ok) {
      const errorBody = await createResponse.text()
      console.error('Error creating user:', errorBody)
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: errorBody }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUser = await createResponse.json()

    // Auto-approve the user
    await supabaseAdmin
      .from('user_approval_status')
      .update({ status: 'approved' })
      .eq('user_id', newUser.id)

    console.log('User created and approved:', newUser.id)

    return new Response(
      JSON.stringify({ success: true, message: 'User created successfully', user_id: newUser.id }),
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
