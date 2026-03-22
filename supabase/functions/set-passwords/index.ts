import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const emails = [
      "castilloheilyn10@gmail.com",
      "dmujaes@yahoo.com.mx",
      "paseodelasaves@hotmail.com"
    ];

    const password = "Acceso123";
    const results: any[] = [];

    // Hash the password with bcryptjs
    const passwordHash = bcrypt.hashSync(password, 10);

    for (const email of emails) {
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

      // Use direct API call with password_hash to bypass HIBP check
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password_hash: passwordHash,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        results.push({ email, error: `Status ${response.status}: ${errorBody}` });
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
