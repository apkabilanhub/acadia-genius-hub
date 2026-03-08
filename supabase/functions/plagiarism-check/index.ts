import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, abstract, techStack, domain, methodology } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an academic plagiarism and originality analysis engine for a university project management system. 
Analyze the submitted project details and provide a comprehensive plagiarism/originality report.
You must respond ONLY by calling the provided tool function.`
          },
          {
            role: "user",
            content: `Analyze this academic project for plagiarism and originality:

Title: ${title}
Domain: ${domain}
Methodology: ${methodology}
Tech Stack: ${(techStack || []).join(", ")}

Abstract:
${abstract}

Provide a detailed plagiarism analysis including similarity percentage, originality assessment, flagged sections, and recommendations.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "plagiarism_report",
              description: "Return a structured plagiarism analysis report",
              parameters: {
                type: "object",
                properties: {
                  similarity_score: {
                    type: "number",
                    description: "Overall similarity percentage (0-100)"
                  },
                  originality_score: {
                    type: "number",
                    description: "Originality percentage (0-100)"
                  },
                  risk_level: {
                    type: "string",
                    enum: ["low", "moderate", "high", "critical"],
                    description: "Overall plagiarism risk level"
                  },
                  summary: {
                    type: "string",
                    description: "Brief overall assessment summary (2-3 sentences)"
                  },
                  flagged_areas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        section: { type: "string", description: "Which part of the project" },
                        concern: { type: "string", description: "What the concern is" },
                        severity: { type: "string", enum: ["low", "medium", "high"] }
                      },
                      required: ["section", "concern", "severity"],
                      additionalProperties: false
                    },
                    description: "Specific areas flagged for potential plagiarism"
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "Original and strong aspects of the project"
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Suggestions to improve originality"
                  },
                  similar_projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        similarity: { type: "number" },
                        source: { type: "string" }
                      },
                      required: ["title", "similarity", "source"],
                      additionalProperties: false
                    },
                    description: "Similar existing projects found"
                  }
                },
                required: ["similarity_score", "originality_score", "risk_level", "summary", "flagged_areas", "strengths", "recommendations", "similar_projects"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "plagiarism_report" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return structured analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const report = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("plagiarism-check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
