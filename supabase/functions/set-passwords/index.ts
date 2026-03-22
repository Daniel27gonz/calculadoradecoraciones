import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const emails = [
      "castilloheilyn10@gmail.com",
      "dmujaes@yahoo.com.mx",
      "paseodelasaves@hotmail.com"
    ];

    const results: any[] = [];

    for (const email of emails) {
      // Find user
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        results.push({ email, error: listError.message });
        continue;
      }

      const user = users?.find(u => u.email === email);
      if (!user) {
        results.push({ email, error: "User not found" });
        continue;
      }

      // Try updating password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: "Acceso123"
      });

      if (updateError) {
        results.push({ email, error: updateError.message });
      } else {
        results.push({ email, success: true });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
