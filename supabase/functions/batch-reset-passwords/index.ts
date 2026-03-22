import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const emails = [
    'castilloheilyn10@gmail.com',
    'dmujaes@yahoo.com.mx',
    'paseodelasaves@hotmail.com',
  ]

  const results = []

  for (const email of emails) {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.find(u => u.email === email)

    if (!user) {
      results.push({ email, status: 'not_found' })
      continue
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: 'Acceso123!'
    })

    // Also ensure approved
    await supabaseAdmin.from('user_approval_status').upsert({
      user_id: user.id,
      status: 'approved',
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    results.push({ email, status: error ? `error: ${error.message}` : 'updated' })
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})