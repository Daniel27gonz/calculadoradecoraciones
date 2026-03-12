import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client with user's auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Validate the JWT token using getClaims
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub as string
    const userEmail = claimsData.claims.email as string

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin client for accessing auth.users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // First, update the current user's profile to include their email
    await supabaseAdmin
      .from('profiles')
      .update({ email: userEmail })
      .eq('user_id', userId)

    // Call the restore function
    const { data: restoreResult, error: restoreError } = await supabaseAdmin
      .rpc('restore_orphaned_user_data', {
      p_new_user_id: userId,
      p_email: userEmail
      })

    if (restoreError) {
      console.error('Restore error:', restoreError)
      return new Response(
        JSON.stringify({ error: 'Failed to restore data', details: restoreError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(restoreResult),
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
