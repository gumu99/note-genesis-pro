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
      <Card className="p-6 bg-card border-border">
        <label className="block text-foreground font-semibold mb-3">
          Enter text, notes, or concepts to explain:
        </label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text, paragraphs, or concepts here..."
          className="min-h-[200px] bg-gradient-primary border-none text-foreground placeholder:text-foreground/50 resize-none"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Button
            onClick={() => generateNotes("normal")}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105"
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
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-all hover:scale-105"
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
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all hover:scale-105"
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

      {generatedNotes && (
        <Card className="p-6 bg-card border-border animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">Generated Explanation</h2>
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="hover:scale-105 transition-transform"
              >
                Copy
              </Button>
              <Button
                onClick={downloadPDF}
                variant="outline"
                className="hover:scale-105 transition-transform"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
          
          <div className="bg-secondary p-6 rounded-lg">
            <pre className="whitespace-pre-wrap text-foreground font-sans text-sm leading-relaxed">
              {generatedNotes}
            </pre>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 text-center">
            ⚠️ PDF Download works on PC only — may not work on mobile devices.
          </p>
        </Card>
      )}
    </div>
  );
};
