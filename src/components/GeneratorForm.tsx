import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FileText, Lightbulb, HelpCircle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

type Mode = "normal" | "important" | "mcqs";

export const GeneratorForm = () => {
  const [text, setText] = useState("");
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode | null>(null);

  const generateNotes = async (mode: Mode) => {
    if (!text.trim()) {
      toast.error("Please enter some text to generate notes");
      return;
    }

    setIsLoading(true);
    setCurrentMode(mode);
    setGeneratedNotes("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, mode }),
        }
      );

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (response.status === 402) {
          toast.error("Payment required. Please add funds to your workspace.");
        } else {
          toast.error("Failed to generate notes. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let accumulatedText = "";

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              accumulatedText += content;
              setGeneratedNotes(accumulatedText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              accumulatedText += content;
              setGeneratedNotes(accumulatedText);
            }
          } catch {}
        }
      }

      toast.success("Notes generated successfully!");
    } catch (error: any) {
      console.error("Error generating notes:", error);
      toast.error("Failed to generate notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedNotes);
    toast.success("Copied to clipboard!");
  };

  const formatNotesWithColors = (notes: string, isStreaming: boolean) => {
    if (!notes) return "";
    
    let formatted = notes;
    
    // Format MCQ questions with green glow and questions in green
    formatted = formatted.replace(
      /^(#?\s*\d+[\.\)]?\s*)(.*?)(\n)/gm,
      (match, num, question, newline) => 
        `<div class="text-neon-green font-bold text-lg mb-2 ${isStreaming ? 'animate-pulse-glow' : ''}">${num}${question}</div>${newline}`
    );
    
    // Format options (A, B, C, D) in white
    formatted = formatted.replace(
      /^\s*[-•]?\s*([A-D][\)\]])\s*(.+?)$/gm,
      '<div class="ml-4 mb-1 text-white">$1 $2</div>'
    );
    
    // Format Correct Answer in pink/accent color with glow
    formatted = formatted.replace(
      /(Correct Answer:\s*[A-D])/gi,
      '<div class="text-accent font-bold text-base mt-2 mb-3">$1</div>'
    );
    
    // Format Explanation in muted color
    formatted = formatted.replace(
      /(Explanation:.*?)(?=\n\n|\n#|\n\d+|$)/gs,
      '<div class="text-muted-foreground text-sm mb-4">$1</div>'
    );
    
    // Format main headings (# ) in large green
    formatted = formatted.replace(
      /^#\s+(.+?)$/gm,
      '<h1 class="text-neon-green font-bold text-2xl mb-4 mt-6">$1</h1>'
    );
    
    // Format subheadings (## ) in medium green
    formatted = formatted.replace(
      /^##\s+(.+?)$/gm,
      '<h2 class="text-neon-green font-bold text-xl mb-3 mt-4">$2</h2>'
    );
    
    // Format sub-subheadings (### ) in smaller green
    formatted = formatted.replace(
      /^###\s+(.+?)$/gm,
      '<h3 class="text-neon-green font-semibold text-lg mb-2 mt-3">$1</h3>'
    );
    
    return formatted;
  };

  const downloadPDF = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("AI Generated Notes", margin, yPosition);
      yPosition += 15;

      // Parse and format content
      const lines = generatedNotes.split("\n");
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        // Check for different formatting patterns
        if (line.match(/^#?\s*\d+[\.\)]?\s*.+/)) {
          // Question number (green in UI)
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 0, 0);
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          wrappedLines.forEach((wLine: string) => {
            pdf.text(wLine, margin, yPosition);
            yPosition += 7;
          });
        } else if (line.match(/^\s*[-•]?\s*[A-D][\)\]]/)) {
          // Options
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(60, 60, 60);
          const wrappedLines = pdf.splitTextToSize(line, maxWidth - 5);
          wrappedLines.forEach((wLine: string) => {
            pdf.text(wLine, margin + 5, yPosition);
            yPosition += 6;
          });
        } else if (line.match(/Correct Answer:/i)) {
          // Correct answer (pink in UI)
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 0, 0);
          pdf.text(line, margin, yPosition);
          yPosition += 8;
        } else if (line.match(/Explanation:/i)) {
          // Explanation
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(100, 100, 100);
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          wrappedLines.forEach((wLine: string) => {
            pdf.text(wLine, margin, yPosition);
            yPosition += 6;
          });
        } else if (line.match(/^#+\s+/)) {
          // Headings
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 0, 0);
          const cleanLine = line.replace(/^#+\s+/, "");
          const wrappedLines = pdf.splitTextToSize(cleanLine, maxWidth);
          wrappedLines.forEach((wLine: string) => {
            pdf.text(wLine, margin, yPosition);
            yPosition += 8;
          });
        } else if (line.trim()) {
          // Regular text
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          wrappedLines.forEach((wLine: string) => {
            pdf.text(wLine, margin, yPosition);
            yPosition += 6;
          });
        } else {
          // Empty line spacing
          yPosition += 4;
        }
      });

      pdf.save("notes.pdf");
      toast.success("PDF downloaded! Note: PDF works best on PC");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Try on PC for best results.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <label className="block text-foreground font-semibold mb-3">
          Enter text, notes, or concepts to explain:
        </label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text, paragraphs, or concepts here..."
          className="min-h-[200px] bg-gradient-input border-none text-white placeholder:text-white/60 resize-none rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] transition-all duration-200 focus:scale-[1.01] focus:shadow-[0_0_20px_rgba(255,0,255,0.4),inset_0_2px_10px_rgba(0,0,0,0.3)]"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Button
            onClick={() => generateNotes("normal")}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] active:animate-button-press disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading && currentMode === "normal" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Normal Notes
          </Button>
          
          <Button
            onClick={() => generateNotes("important")}
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] active:animate-button-press disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading && currentMode === "important" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4 mr-2" />
            )}
            Important Topics
          </Button>
          
          <Button
            onClick={() => generateNotes("mcqs")}
            disabled={isLoading}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all duration-200 hover:scale-105 hover:shadow-[0_0_15px_rgba(100,100,100,0.4)] active:animate-button-press disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading && currentMode === "mcqs" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <HelpCircle className="w-4 h-4 mr-2" />
            )}
            MCQs
          </Button>
        </div>
      </Card>

      {isLoading && (
        <div className="w-full bg-muted/50 rounded-full p-4 animate-pulse-glow">
          <div className="flex items-center justify-center gap-2 text-neon-purple">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Generating...</span>
          </div>
        </div>
      )}

      {generatedNotes && (
        <Card className="p-6 bg-[rgba(20,20,20,0.8)] border-neon-purple/30 shadow-[0_0_30px_rgba(180,0,255,0.6)] animate-scale-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">Generated Explanation</h2>
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="bg-white text-black border-white hover:bg-white/90 hover:scale-105 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-200 active:animate-button-press"
              >
                Copy
              </Button>
              <Button
                onClick={downloadPDF}
                className="bg-black text-white border-2 border-white hover:bg-black/90 hover:scale-105 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-200 active:animate-button-press"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-yellow-400 mb-4 flex items-center gap-2">
            ⚠️ PDF download works on PC only — may not work on mobile devices.
          </p>
          
          <div className="bg-black/40 p-6 rounded-lg border border-neon-purple/20">
            <div 
              className="whitespace-pre-wrap text-white font-sans text-base leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{
                __html: formatNotesWithColors(generatedNotes, isLoading)
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
};
