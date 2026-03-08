import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language, source_code } = await req.json();

    if (!source_code || !language) {
      return new Response(
        JSON.stringify({ error: "Missing source_code or language" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map our language names to Piston API names
    const languageMap: Record<string, { language: string; version: string }> = {
      python: { language: "python", version: "3.10.0" },
      javascript: { language: "javascript", version: "18.15.0" },
      java: { language: "java", version: "15.0.2" },
      c: { language: "c", version: "10.2.0" },
      cpp: { language: "c++", version: "10.2.0" },
      go: { language: "go", version: "1.16.2" },
      rust: { language: "rust", version: "1.68.2" },
      typescript: { language: "typescript", version: "5.0.3" },
    };

    const langConfig = languageMap[language.toLowerCase()];
    if (!langConfig) {
      // Fallback: use AI to simulate execution
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "No execution engine available for this language" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are a code execution simulator. Given source code, simulate what the output would be if the code were executed. Return ONLY the output, nothing else. If there would be an error, return the error message.",
            },
            {
              role: "user",
              content: `Simulate the execution of this ${language} code:\n\n${source_code}`,
            },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI error:", errText);
        return new Response(
          JSON.stringify({ output: "Error: Could not execute code", error: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();
      const output = aiData.choices?.[0]?.message?.content || "No output";

      return new Response(
        JSON.stringify({ output, simulated: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Piston API for supported languages
    const pistonResponse = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: [{ content: source_code }],
      }),
    });

    if (!pistonResponse.ok) {
      const errText = await pistonResponse.text();
      console.error("Piston API error:", errText);
      return new Response(
        JSON.stringify({ output: "Execution service unavailable. Please try again.", error: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await pistonResponse.json();
    const output = result.run?.output || result.compile?.output || "No output";
    const hasError = result.run?.code !== 0;

    return new Response(
      JSON.stringify({ output: output.trim(), error: hasError }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("run-code error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
