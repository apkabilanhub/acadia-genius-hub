import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { submission_id } = await req.json();
    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: "Missing submission_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the submission
    const { data: submission, error: fetchError } = await supabase
      .from("project_submissions")
      .select("*")
      .eq("id", submission_id)
      .single();

    if (fetchError || !submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI analysis using tool calling for structured output
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
            content: `You are an academic code plagiarism and quality analyzer. Analyze the submitted code for:
1. Plagiarism indicators (common patterns, boilerplate, tutorial code, copied snippets)
2. AI-generated code detection (patterns typical of ChatGPT, Copilot, etc.)
3. Code quality and innovation
4. Overall academic grade

Be realistic and thorough. Consider the language, complexity, and originality.`,
          },
          {
            role: "user",
            content: `Analyze this ${submission.language} code submission titled "${submission.title}":\n\n${submission.source_code}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_analysis",
              description: "Submit the plagiarism and quality analysis results",
              parameters: {
                type: "object",
                properties: {
                  plagiarism_score: {
                    type: "number",
                    description: "Plagiarism percentage 0-100. Higher means more plagiarized.",
                  },
                  ai_code_copy_score: {
                    type: "number",
                    description: "AI-generated code percentage 0-100. Higher means more AI-generated.",
                  },
                  ai_grade: {
                    type: "number",
                    description: "Overall quality grade 0-100.",
                  },
                  summary: {
                    type: "string",
                    description: "Brief analysis summary in 2-3 sentences.",
                  },
                },
                required: ["plagiarism_score", "ai_code_copy_score", "ai_grade", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Update the submission with scores
    const { error: updateError } = await supabase
      .from("project_submissions")
      .update({
        plagiarism_score: analysis.plagiarism_score,
        ai_code_copy_score: analysis.ai_code_copy_score,
        ai_grade: analysis.ai_grade,
        status: "analyzed",
      })
      .eq("id", submission_id);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return new Response(
      JSON.stringify({
        plagiarism_score: analysis.plagiarism_score,
        ai_code_copy_score: analysis.ai_code_copy_score,
        ai_grade: analysis.ai_grade,
        summary: analysis.summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-submission error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
