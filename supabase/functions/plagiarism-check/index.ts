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
            content: `You are ProjectHub's advanced academic plagiarism and originality analysis engine for SRMIST (SRM Institute of Science and Technology).

Your job is to deeply analyze student project submissions and provide a thorough plagiarism & originality report. Consider:

1. **Content Similarity**: Check if the project title, abstract, and approach closely mirror existing published projects, papers, or open-source repositories.
2. **Code Originality**: Evaluate whether the tech stack usage and implementation approach seem original or follow common boilerplate/tutorial patterns.
3. **Methodology Uniqueness**: Assess if the methodology is a novel application or a direct copy of standard approaches.
4. **Cross-Reference**: Compare against common university project patterns in the given domain.
5. **Red Flags**: Look for signs of copied content — generic abstracts, mismatched tech stack with methodology, overly common project ideas without unique angle.

Be fair but thorough. Provide actionable feedback students can use to improve originality.
You must respond ONLY by calling the provided tool function.`
          },
          {
            role: "user",
            content: `Perform a comprehensive plagiarism and originality analysis for this SRMIST student project:

**Project Title:** ${title}
**Domain:** ${domain}
**Methodology:** ${methodology}
**Technology Stack:** ${(techStack || []).join(", ")}

**Abstract:**
${abstract}

Provide detailed scores for content similarity, code originality, methodology uniqueness, flag specific areas of concern, identify similar existing works, and give actionable recommendations.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "plagiarism_report",
              description: "Return a comprehensive structured plagiarism analysis report",
              parameters: {
                type: "object",
                properties: {
                  similarity_score: {
                    type: "number",
                    description: "Overall content similarity percentage (0-100). Lower is more original."
                  },
                  originality_score: {
                    type: "number",
                    description: "Overall originality percentage (0-100). Higher is more original."
                  },
                  code_originality_score: {
                    type: "number",
                    description: "Code/implementation originality score (0-100). Assesses if tech stack usage is unique vs boilerplate."
                  },
                  methodology_originality_score: {
                    type: "number",
                    description: "Methodology uniqueness score (0-100). Assesses if the approach is novel."
                  },
                  risk_level: {
                    type: "string",
                    enum: ["low", "moderate", "high", "critical"],
                    description: "Overall plagiarism risk level"
                  },
                  summary: {
                    type: "string",
                    description: "Concise 2-3 sentence overall assessment"
                  },
                  detailed_analysis: {
                    type: "string",
                    description: "In-depth 4-6 sentence analysis covering content, code, methodology, and academic integrity aspects"
                  },
                  flagged_areas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        section: { type: "string", description: "Which part (Title, Abstract, Methodology, Tech Stack, etc.)" },
                        concern: { type: "string", description: "Specific concern explanation" },
                        severity: { type: "string", enum: ["low", "medium", "high"] },
                        matched_source: { type: "string", description: "Source it potentially matches, if applicable" }
                      },
                      required: ["section", "concern", "severity"],
                      additionalProperties: false
                    }
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "Original and strong aspects (3-5 points)"
                  },
                  weaknesses: {
                    type: "array",
                    items: { type: "string" },
                    description: "Areas lacking originality or needing improvement (2-4 points)"
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific actionable suggestions to improve originality (3-5 points)"
                  },
                  similar_projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        similarity: { type: "number" },
                        source: { type: "string", description: "Where this similar work exists (e.g. GitHub, IEEE, arXiv, university repo)" },
                        overlap_type: { type: "string", description: "Type of overlap: concept, implementation, methodology, or content" }
                      },
                      required: ["title", "similarity", "source", "overlap_type"],
                      additionalProperties: false
                    }
                  }
                },
                required: [
                  "similarity_score", "originality_score", "code_originality_score",
                  "methodology_originality_score", "risk_level", "summary", "detailed_analysis",
                  "flagged_areas", "strengths", "weaknesses", "recommendations", "similar_projects"
                ],
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
