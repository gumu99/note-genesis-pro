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
    const { fileBase64, mimeType, fileType } = await req.json();
    
    if (!fileBase64) {
      throw new Error("Missing required parameter: fileBase64");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log(`Extracting text from ${fileType || 'file'} using OpenAI with advanced OCR...`);

    const systemPrompt = `You are an advanced OCR and text extraction specialist. Your task is to extract ALL text from the provided ${fileType === 'pdf' ? 'PDF document' : 'image'}, including:

CRITICAL OCR REQUIREMENTS:
- Extract text from SCANNED documents and images of text
- Read handwritten text if present
- Recognize text in photos, screenshots, and low-quality images
- Extract text from tables, diagrams, charts, and infographics
- Read text that may be rotated, skewed, or at angles
- Identify and extract text from watermarks if readable
- Process multi-column layouts correctly

OUTPUT RULES:
- Extract EVERY line of text visible, no matter how small
- Preserve the original structure and formatting as much as possible
- Include headings, paragraphs, bullet points, numbered lists
- Do NOT add any commentary, explanations, or summaries
- Do NOT modify or interpret the text
- Do NOT add markdown formatting that wasn't in the original
- If there are tables, preserve the table structure using simple text formatting
- If text is unclear, make your best attempt to read it - guess if necessary
- Output ONLY the extracted text, nothing else

IMPORTANT: This may be a scanned document or photograph of text. Use your full OCR capabilities to read ALL visible text.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Extract ALL text from this ${fileType === 'pdf' ? 'PDF document (this may be a scanned document with images of text - use OCR)' : 'image (use OCR to read any text in photos or scanned content)'}. Return only the extracted text, nothing else. Be thorough - extract every piece of readable text.`
      }
    ];

    // For images, include the image directly
    if (fileType === 'image' || mimeType?.startsWith('image/')) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType || 'image/png'};base64,${fileBase64}`
        }
      });
    } else if (fileType === 'pdf') {
      // For PDFs, send as document
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:application/pdf;base64,${fileBase64}`
        }
      });
    }

    // Use gpt-4o for vision capabilities
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        max_tokens: 4096,
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

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || "";

    console.log("Text extraction completed successfully");

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-text function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
