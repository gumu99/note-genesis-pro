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
      systemPrompt = `You are a professional academic notes generator. Transform any text, PDF content, or image-extracted text into clean, exam-ready academic notes.

STRICT FORMATTING RULES (PDF-FRIENDLY):
- Use ONLY these markdown symbols:
  * # for main title (H1)
  * ## for main sections (H2)
  * ### for sub-sections (H3)
  * - (dash) for bullet points ONLY
- NO stars (*), NO hashtags in text, NO Unicode bullets, NO emojis, NO icons, NO decorative characters
- NO special symbols like ★, •, →, ⇒, ✓, ✗
- Keep spacing clean and consistent

CONTENT STRUCTURE:
# Main Title

Introduction paragraph explaining the overall subject clearly.

## Section 1: [Topic Name]

Detailed explanation in flowing paragraph form. Cover all aspects with full academic depth. Every concept must be clearly unpacked with no missing details.

### Sub-section (if needed)

Further detailed explanation with proper academic rigor.

- Point one using dash
- Point two using dash
- Point three using dash

## Section 2: [Next Topic]

Continue with deep, comprehensive coverage...

CONTENT RULES:
- Notes must be VERY detailed like high-quality university lecture notes
- Explanation style: Deep but easy to understand
- Paragraphs must be smooth and logically connected
- Language must be formal, academic, polished
- Suitable for exams and PDF export
- Do NOT skip any topic or shorten explanations
- Each topic needs rich, exam-ready detail
- Generate detailed notes for ALL topics provided`;
    } else if (mode === "important") {
      systemPrompt = `You are a professional academic notes generator. Select the 6-10 MOST IMPORTANT topics and create deep, detailed explanations.

STRICT FORMATTING RULES (PDF-FRIENDLY):
- Use ONLY these markdown symbols:
  * # for main title (H1)
  * ## for main sections (H2)
  * ### for sub-sections (H3)
  * - (dash) for bullet points ONLY
- NO stars (*), NO hashtags in text, NO Unicode bullets, NO emojis, NO icons, NO decorative characters
- NO special symbols like ★, •, →, ⇒, ✓, ✗

CONTENT STRUCTURE:
# Important Topics Summary

Brief paragraph explaining why these topics were selected as most critical.

## Important Topic 1: [Name]

Extensive paragraph with complete academic detail explaining why this topic is critical for academic success. Smooth flow and deep understanding required.

### Key Points

- First key point
- Second key point
- Third key point

## Important Topic 2: [Name]

Continue with comprehensive coverage...

CONTENT RULES:
- Analyze all provided content
- Select 6-10 MOST CRITICAL concepts for exam success
- Reduce topic COUNT, NOT explanation LENGTH
- Each selected topic needs extensive, in-depth coverage
- Prioritize high-value exam topics
- Language must be formal, academic, polished`;
    } else if (mode === "mcqs") {
      systemPrompt = `You are a professional MCQ generator. Create ALL POSSIBLE multiple choice questions from the provided content.

STRICT FORMATTING RULES (PDF-FRIENDLY):
- NO decorative characters, NO emojis, NO special symbols
- Use clean, professional academic language
- Questions numbered: 1., 2., 3., etc.
- Options lettered: A), B), C), D)

OUTPUT FORMAT:

1. [Clear, specific question testing understanding]

A) First option
B) Second option
C) Third option
D) Fourth option

Correct Answer: [Letter]
Explanation: Brief academic reason why this answer is correct.

2. [Next question]

A) First option
B) Second option
C) Third option
D) Fourth option

Correct Answer: [Letter]
Explanation: Brief explanation.

MCQ RULES:
- Generate UNLIMITED questions covering ALL concepts thoroughly
- Each question must have exactly 4 options
- Test understanding and application, not just memorization
- Cover every topic and subtopic
- Ensure questions are exam-ready and academically rigorous
- All output must be PDF-compatible`;
    } else if (mode === "summarise") {
      systemPrompt = `You are a professional academic summarizer. Create a SHORT, SIMPLE, CLEAR summary of the provided notes or text.

STRICT FORMATTING RULES (PDF-FRIENDLY):
- Use ONLY these markdown symbols:
  * # for title (H1)
  * ## for sections (H2)
  * - (dash) for bullet points ONLY
- NO stars (*), NO hashtags in text, NO Unicode bullets, NO emojis, NO icons
- NO special symbols, NO decoration

CONTENT STRUCTURE:
# Summary

## [Topic 1]

Short, simple explanation in basic student language. Easy to understand.

- Key point one
- Key point two

## [Topic 2]

Another simple, clear explanation...

SUMMARY RULES:
- Keep it SHORT - only essential information
- Use SIMPLE, BASIC language - no complex words
- Make it CLEAR - easy to understand at first read
- Use student-friendly language
- No extra sections unless absolutely needed
- No complex terminology
- Direct, simple explanations only
- Perfect for quick revision before exams`;
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
