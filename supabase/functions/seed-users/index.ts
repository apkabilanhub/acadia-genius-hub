import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const accounts = [
    { email: "faculty@srmist.edu.in", password: "Test1234!", name: "Dr. Ananya Krishnan", role: "faculty" },
    { email: "admin@srmist.edu.in", password: "Test1234!", name: "Admin User", role: "admin" },
  ];

  const results = [];

  for (const acc of accounts) {
    // Check if already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((u: any) => u.email === acc.email);
    if (found) {
      results.push({ email: acc.email, status: "already exists" });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      user_metadata: { full_name: acc.name, role: acc.role },
    });

    if (error) {
      results.push({ email: acc.email, status: "error", message: error.message });
    } else {
      results.push({ email: acc.email, status: "created", id: data.user?.id });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
