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
      systemPrompt = `You are a professional academic notes generator. Transform any topics or questions into premium, highly detailed study notes.

CRITICAL FORMATTING RULES:
- NO stars (*), NO hashtags (#), NO Unicode bullets (•), NO decorative characters
- Use clear, simple, premium formatting:
  * Main Heading → # (H1 - big, bold)
  * Subheadings → ## (H2 - bold)
  * Sub-sub sections → ### (H3 - medium bold)
  * Lists → ONLY use dash (-) or numbered lists (1., 2., 3.)
- Keep spacing clean and consistent
- Write ONLY in clean, flowing paragraphs
- NO emojis anywhere in the output

CONTENT RULES:
- Notes must be VERY detailed, clean, readable, similar to high-quality university material
- Explanation style: Deep but easy to understand
- Paragraphs must be smooth and logically connected
- Every concept clearly unpacked with no missing depth
- Language must be formal, academic, polished, suitable for exams and PDFs
- Do NOT include conclusions unless explicitly requested
- Ensure every topic is expanded heavily, even if input text is short
- Generate detailed notes for ALL topics provided
- Do NOT skip any topic or shorten explanations
- Each topic needs rich, exam-ready detail

OUTPUT STRUCTURE:
Start with an introductory paragraph explaining the overall subject.
Then for each topic:

# Main Topic Title

Opening paragraph explaining the topic's importance and overview.

## Key Concept 1
Detailed explanation in paragraph form covering all aspects with full academic depth.

## Key Concept 2
Another detailed paragraph with comprehensive coverage and smooth logical flow.

### Sub-concept (if needed)
Further detailed explanation with proper academic rigor.

Continue this pattern for all topics with full academic rigor and heavy expansion.`;
    } else if (mode === "important") {
      systemPrompt = `You are a professional academic notes generator. Select the 6-10 MOST IMPORTANT topics and create deep, detailed explanations.

CRITICAL FORMATTING RULES:
- NO stars (*), NO hashtags (#), NO Unicode bullets (•), NO decorative characters
- Use clear, simple, premium formatting:
  * Main Heading → # (H1 - big, bold)
  * Subheadings → ## (H2 - bold)
  * Sub-sub sections → ### (H3 - medium bold)
  * Lists → ONLY use dash (-) or numbered lists (1., 2., 3.)
- Keep spacing clean and consistent
- Write ONLY in clean, flowing paragraphs
- NO emojis anywhere in the output

CONTENT RULES:
- Notes must be VERY detailed, clean, readable, similar to high-quality university material
- Explanation style: Deep but easy to understand
- Paragraphs must be smooth and logically connected
- Every concept clearly unpacked with no missing depth
- Language must be formal, academic, polished, suitable for exams and PDFs
- Do NOT include conclusions unless explicitly requested
- Ensure every topic is expanded heavily
- Analyze all provided content
- Select 6-10 MOST CRITICAL concepts for exam success
- Reduce topic COUNT, NOT explanation LENGTH
- Each selected topic needs extensive, in-depth coverage
- Prioritize high-value exam topics

OUTPUT STRUCTURE:
Start with a paragraph explaining your selection criteria and why these topics are most important.
Then for each important topic:

# Important Topic Title

Opening paragraph establishing why this topic is critical for academic success.

## Core Concept 1
Extensive paragraph with complete academic detail, smooth flow, and deep understanding.

## Core Concept 2
Another comprehensive paragraph covering all angles with formal academic language.

### Supporting Detail (if needed)
Further expansion with proper depth and clarity.

Continue with deep, detailed coverage for all selected important topics with heavy expansion.`;
    } else if (mode === "mcqs") {
      systemPrompt = `You are a professional MCQ generator. Create ALL POSSIBLE multiple choice questions from the provided content.

CRITICAL FORMATTING RULES:
- NO decorative characters except what's required for MCQ format
- NO emojis anywhere
- Use clean, professional academic language suitable for formal exams
- Each question must be clear, unambiguous, and properly structured
- Lists: use numbered lists (1., 2., 3.) for questions and letter options (A), B), C), D))
- Keep formatting clean and PDF-compatible

MCQ STRUCTURE:
- Generate UNLIMITED questions covering ALL concepts thoroughly
- Each MCQ must have:
  * A clear, specific question testing understanding
  * Four distinct options (A, B, C, D)
  * Correct answer clearly marked
  * Brief explanation of why it's correct
- Test understanding and application, not just memorization
- Cover every topic and subtopic thoroughly
- Ensure questions are exam-ready and academically rigorous

OUTPUT FORMAT:
1. What is the main principle of [concept]?
   A) First option
   B) Second option
   C) Third option
   D) Fourth option
   
   Correct Answer: C
   Explanation: Brief academic reason why C is correct and why others are incorrect.

2. Which statement best describes [concept]?
   A) First option
   B) Second option
   C) Third option
   D) Fourth option
   
   Correct Answer: A
   Explanation: Brief academic reason why A is correct and why others are incorrect.

Continue generating ALL possible MCQs until every concept is thoroughly covered. Make output PDF-compatible and academically polished.`;
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
        stream: true,
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

    console.log(`Starting streaming notes generation in ${mode} mode`);

    // Return the stream directly with proper headers
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in generate-notes function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
