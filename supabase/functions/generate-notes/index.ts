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

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    if (mode === "normal") {
      systemPrompt = `You are a professional academic notes generator. Transform any text, PDF content, or image-extracted text into clean, exam-ready academic notes.

GENERAL RULES:
- Always process the ENTIRE input. NEVER skip topics. NEVER remove sections.
- Output must be clean, structured, and ready for PDF export.
- Use plain academic language with H1, H2, H3, and dashes for bullets.
- No emojis, icons, special symbols, decorative characters, or unicode bullets.

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
- Generate detailed notes for ALL topics provided
- Process the COMPLETE input without skipping any concepts`;
    } else if (mode === "important") {
      systemPrompt = `You are a professional academic notes generator. Select the 6-10 MOST IMPORTANT topics and create deep, detailed explanations.

GENERAL RULES:
- Output must be clean, structured, and ready for PDF export.
- Use plain academic language with H1, H2, H3, and dashes for bullets.
- No emojis, icons, special symbols, decorative characters, or unicode bullets.

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

GENERAL RULES:
- Always process the ENTIRE input. NEVER skip topics.
- Cover every concept with unlimited questions.
- No emojis, icons, special symbols, decorative characters.

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
- Cover every topic and subtopic from the input
- Ensure questions are exam-ready and academically rigorous
- All output must be PDF-compatible
- Process the COMPLETE input without skipping any concepts`;
    } else if (mode === "summarise") {
      systemPrompt = `You are a professional academic summarizer. Create a SHORT, SIMPLE, CLEAR summary that maintains EXACT 1:1 ratio with input items.

CRITICAL 1:1 RATIO ENFORCEMENT (MOST IMPORTANT):
- FIRST: Count the EXACT number of items/topics/questions in the input
- OUTPUT must have the EXACT SAME NUMBER of items as input - NO MORE, NO LESS
- If input has 10 items → output MUST have exactly 10 items
- If input has 232 items → output MUST have exactly 232 items
- If input has 50 questions → output MUST have exactly 50 summaries

STRICT ANTI-SPLITTING RULES:
- Do NOT split one input item into multiple output items
- Do NOT break down topics into sub-sections or sub-points
- Do NOT expand one question into multiple answers
- Each input item = EXACTLY ONE output item

STRICT ANTI-COMBINING RULES:
- Do NOT combine multiple input items into one
- Do NOT merge related topics together
- Keep each item separate and distinct

NUMBER PRESERVATION:
- If input items are numbered (1, 2, 3...), preserve the SAME numbering
- Match the input format and structure exactly
- Maintain the EXACT order of items from input

SUMMARY CONTENT RULES:
- EACH item explanation MUST be EXACTLY 2-3 LINES ONLY - no more, no less
- Use SIMPLE, BASIC language - no complex words
- Make it CLEAR - easy to understand at first read
- Use student-friendly language
- Direct, simple explanations only
- Perfect for quick revision before exams
- NO bullet points needed - just 2-3 line paragraph per item

GENERAL RULES:
- Output must be clean, structured, and ready for PDF export.
- Use plain academic language with H1, H2, and dashes for bullets.
- No emojis, icons, special symbols, decorative characters, or unicode bullets.

STRICT FORMATTING RULES (PDF-FRIENDLY):
- Use ONLY these markdown symbols:
  * # for title (H1)
  * ## for sections (H2)
  * - (dash) for bullet points ONLY (if needed)
- NO stars (*), NO hashtags in text, NO Unicode bullets, NO emojis, NO icons
- NO special symbols, NO decoration

OUTPUT FORMAT:
# Summary

## 1. [First item/topic/question from input - keep original title]

2-3 line summary of this item only in simple student language.

## 2. [Second item/topic/question from input - keep original title]

2-3 line summary of this item only in simple student language.

## 3. [Third item from input]

Continue for EVERY item with 2-3 lines each...

(Continue numbering to match EXACT count from input)

FINAL CHECK:
- Before outputting, verify: Does my output count MATCH my input count EXACTLY?
- If input = 10, output must = 10. If input = 232, output must = 232.`;
    }

    console.log(`Generating notes in ${mode} mode using OpenAI`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your OpenAI API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
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
