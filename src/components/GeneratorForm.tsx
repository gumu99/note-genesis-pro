import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FileText, Lightbulb, HelpCircle, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase.functions.invoke("generate-notes", {
        body: { text, mode },
      });

      if (error) throw error;

      if (data?.notes) {
        setGeneratedNotes(data.notes);
        toast.success("Notes generated successfully!");
      }
    } catch (error: any) {
      console.error("Error generating notes:", error);
      if (error.message?.includes("429")) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes("402")) {
        toast.error("Payment required. Please add funds to your workspace.");
      } else {
        toast.error("Failed to generate notes. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedNotes);
    toast.success("Copied to clipboard!");
  };

  const downloadPDF = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      pdf.setFontSize(16);
      pdf.text("AI Generated Notes", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(generatedNotes, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 7;
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
            <pre className="whitespace-pre-wrap text-white font-sans text-sm leading-relaxed [&>*:first-child]:text-neon-green [&>*:first-child]:text-xl [&>*:first-child]:font-bold [&_strong]:text-lg [&_strong]:text-white">
              {generatedNotes}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
};
