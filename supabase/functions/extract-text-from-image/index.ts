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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Extracting text from ${fileType || 'file'} using Lovable AI...`);

    const systemPrompt = `You are a text extraction assistant. Your ONLY job is to extract ALL readable text from the provided ${fileType === 'pdf' ? 'PDF document' : 'image'}.

RULES:
- Extract EVERY line of text visible
- Preserve the original structure and formatting as much as possible
- Include headings, paragraphs, bullet points, numbered lists
- Do NOT add any commentary, explanations, or summaries
- Do NOT modify or interpret the text
- Do NOT add markdown formatting that wasn't in the original
- If there are tables, preserve the table structure using simple text formatting
- If text is unclear, make your best attempt to read it
- Output ONLY the extracted text, nothing else`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Extract all text from this ${fileType === 'pdf' ? 'PDF document' : 'image'}. Return only the extracted text, nothing else.`
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
      // For PDFs, we'll send it as a document (Gemini supports PDF)
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:application/pdf;base64,${fileBase64}`
        }
      });
    }

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
          { role: "user", content: userContent }
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
          JSON.stringify({ error: "Payment required. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
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
