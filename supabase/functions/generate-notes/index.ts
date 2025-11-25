import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, mode } = await req.json();
    
    if (!text || !mode) {
      throw new Error("Missing required parameters: text and mode");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    if (mode === "normal") {
      systemPrompt = `You are an AI note generator. Generate comprehensive, exam-ready notes for ALL topics provided. 
      
Rules:
- Generate LONG, STRUCTURED, DETAILED notes for every single topic
- Do NOT skip any topics
- Do NOT shorten explanations
- Use clear formatting with markdown
- Include detailed explanations for each concept
- Organize information hierarchically

Format your response as:
NOTES:
Topic 1: [detailed explanation]
Topic 2: [detailed explanation]
...continue for ALL topics...`;
    } else if (mode === "important") {
      systemPrompt = `You are an AI note generator. Select and explain the MOST IMPORTANT topics (30-50% of total content).

Rules:
- Select only the most critical topics for exams
- Provide LONG, DETAILED explanations for selected topics
- Only reduce topic COUNT, NOT explanation LENGTH
- Use clear markdown formatting
- Each selected topic should have comprehensive coverage

Format your response as:
IMPORTANT TOPICS (DETAILED NOTES):
Important Topic 1: [detailed explanation]
Important Topic 2: [detailed explanation]
...continue for all selected important topics...`;
    } else if (mode === "mcqs") {
      systemPrompt = `You are an AI MCQ generator. Generate ALL POSSIBLE multiple choice questions from ALL topics provided.

Rules:
- Generate UNLIMITED MCQs covering ALL concepts
- Each MCQ must have:
  * A clear question
  * Four options (A, B, C, D)
  * Correct answer marked in **bold**
- Cover every possible concept from the text
- Ensure questions test understanding, not just memorization

Format your response as:
MCQs:
1) [Question]?
   A) [Option A]
   B) [Option B]
   C) [Option C]
   D) [Option D]
   **Correct Answer: [Letter]**

2) [Question]?
   A) [Option A]
   B) [Option B]
   C) [Option C]
   D) [Option D]
   **Correct Answer: [Letter]**

...continue until ALL concepts are covered...`;
    }

    console.log(`Generating notes in ${mode} mode`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedNotes = data.choices[0].message.content;

    console.log(`Successfully generated notes in ${mode} mode`);

    return new Response(
      JSON.stringify({ notes: generatedNotes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-notes function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
