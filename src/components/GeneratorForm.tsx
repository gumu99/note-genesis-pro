import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Lightbulb, HelpCircle, Download, Loader2, BookOpen, Upload, X, FileImage, File, Plus, Mic, AudioWaveform } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { ModePopup } from "./ModePopup";
import { cn } from "@/lib/utils";

type Mode = "normal" | "important" | "mcqs" | "summarise";

interface UploadedFile {
  file: File;
  name: string;
  type: "pdf" | "image";
  extractedText?: string;
  isExtracting?: boolean;
}

export const GeneratorForm = () => {
  const [text, setText] = useState("");
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isModePopupOpen, setIsModePopupOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromFile = async (file: File, fileType: "pdf" | "image"): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-text-from-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            fileBase64: base64,
            mimeType: file.type,
            fileType: fileType,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        } else if (response.status === 402) {
          throw new Error("Payment required. Please add funds to your workspace.");
        }
        throw new Error(`Failed to extract text from ${fileType}`);
      }

      const data = await response.json();
      return data.text || "";
    } catch (error) {
      console.error(`Error extracting ${fileType} text:`, error);
      throw error;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const isPDF = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      if (!isPDF && !isImage) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }

      const fileType = isPDF ? "pdf" : "image";

      const newFile: UploadedFile = {
        file,
        name: file.name,
        type: fileType,
        isExtracting: true,
      };

      setUploadedFiles((prev) => [...prev, newFile]);

      try {
        const extractedText = await extractTextFromFile(file, fileType);

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? { ...f, extractedText, isExtracting: false }
              : f
          )
        );

        toast.success(`Text extracted from ${file.name}`);
      } catch (error: any) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? { ...f, isExtracting: false, extractedText: "" }
              : f
          )
        );
        toast.error(error.message || `Failed to extract text from ${file.name}`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileToRemove: UploadedFile) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file !== fileToRemove.file));
  };

  const getCombinedText = (): string => {
    const fileTexts = uploadedFiles
      .filter((f) => f.extractedText)
      .map((f) => f.extractedText)
      .join("\n\n");

    if (text.trim() && fileTexts) {
      return `${text}\n\n${fileTexts}`;
    }
    return text.trim() || fileTexts;
  };

  const generateNotes = async (mode: Mode) => {
    const combinedText = getCombinedText();
    
    if (!combinedText) {
      toast.error("Please enter some text or upload a file to generate notes");
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
          body: JSON.stringify({ text: combinedText, mode }),
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
    
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv'];
    
    const lines = notes.split('\n');
    let mainCounter = 0;
    let subCounter = 0;
    
    const formattedLines = lines.map(line => {
      if (line.match(/^#\s+(.+?)$/)) {
        mainCounter++;
        subCounter = 0;
        const heading = line.replace(/^#\s+/, '');
        return `<h1 class="text-neon-green font-bold text-2xl mb-4 mt-6">${mainCounter}. ${heading}</h1>`;
      }
      
      if (line.match(/^##\s+(.+?)$/)) {
        const heading = line.replace(/^##\s+/, '');
        const roman = romanNumerals[subCounter] || `(${subCounter + 1})`;
        subCounter++;
        return `<h2 class="text-neon-green font-bold text-xl mb-3 mt-4 ml-4">${roman}. ${heading}</h2>`;
      }
      
      if (line.match(/^###\s+(.+?)$/)) {
        const heading = line.replace(/^###\s+/, '');
        return `<h3 class="text-neon-green font-semibold text-lg mb-2 mt-3 ml-8">- ${heading}</h3>`;
      }
      
      if (line.match(/^#{4,}\s+(.+?)$/)) {
        const heading = line.replace(/^#{4,}\s+/, '');
        return `<div class="text-neon-green font-medium text-base mb-2 mt-2 ml-12">- ${heading}</div>`;
      }
      
      if (line.match(/^\s*-\s+(.+?)$/)) {
        const content = line.replace(/^\s*-\s+/, '');
        return `<div class="ml-8 mb-1 text-white">- ${content}</div>`;
      }
      
      if (line.match(/^(#?\s*\d+[\.\)]?\s*)/)) {
        return `<div class="text-neon-green font-bold text-lg mb-2 ${isStreaming ? 'animate-pulse-glow' : ''}">${line}</div>`;
      }
      
      if (line.match(/^\s*[-•]?\s*([A-D][\)\]])\s*(.+?)$/)) {
        return `<div class="ml-4 mb-1 text-white">${line.trim()}</div>`;
      }
      
      if (line.match(/Correct Answer:/i)) {
        return `<div class="text-accent font-bold text-base mt-2 mb-3">${line}</div>`;
      }
      
      if (line.match(/Explanation:/i)) {
        return `<div class="text-muted-foreground text-sm mb-4">${line}</div>`;
      }
      
      return line;
    });
    
    return formattedLines.join('\n');
  };

  const downloadPDF = () => {
    try {
      const pdf = new jsPDF();
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(180, 0, 255);
      pdf.textWithLink("Made with note-genesis-pro.lovable.app", pageWidth - margin - 55, 8, {
        url: "https://note-genesis-pro.lovable.app/"
      });
      
      yPosition = margin + 5;

      const addBlackPage = () => {
        pdf.addPage();
        pdf.setFillColor(0, 0, 0);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(180, 0, 255);
        pdf.textWithLink("Made with note-genesis-pro.lovable.app", pageWidth - margin - 55, 8, {
          url: "https://note-genesis-pro.lovable.app/"
        });
        yPosition = margin + 5;
      };

      const lines = generatedNotes.split("\n");
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          addBlackPage();
        }

        if (line.match(/^Q:\s*.+/) || line.match(/^#?\s*\d+[\.\)]\s*.+/)) {
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 255, 100);
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          wrappedLines.forEach((wLine: string) => {
            if (yPosition > pageHeight - margin) addBlackPage();
            pdf.text(wLine, margin, yPosition);
            yPosition += 8;
          });
          yPosition += 3;
        } 
        else if (line.match(/^#\s+/)) {
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255, 80, 180);
          const cleanLine = line.replace(/^#\s+/, "");
          const wrappedLines = pdf.splitTextToSize(cleanLine, maxWidth);
          wrappedLines.forEach((wLine: string) => {
            if (yPosition > pageHeight - margin) addBlackPage();
            pdf.text(wLine, margin, yPosition);
            yPosition += 9;
          });
          yPosition += 3;
        }
        else if (line.match(/^##\s+/)) {
          pdf.setFontSize(13);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255, 80, 180);
          const cleanLine = line.replace(/^##\s+/, "");
          const wrappedLines = pdf.splitTextToSize(cleanLine, maxWidth);
          wrappedLines.forEach((wLine: string) => {
            if (yPosition > pageHeight - margin) addBlackPage();
            pdf.text(wLine, margin + 5, yPosition);
            yPosition += 7;
          });
          yPosition += 2;
        }
        else if (line.match(/^###\s+/)) {
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255, 120, 200);
          const cleanLine = line.replace(/^###\s+/, "");
          const wrappedLines = pdf.splitTextToSize("- " + cleanLine, maxWidth - 10);
          wrappedLines.forEach((wLine: string) => {
            if (yPosition > pageHeight - margin) addBlackPage();
            pdf.text(wLine, margin + 10, yPosition);
            yPosition += 6;
          });
          yPosition += 2;
        }
        else if (line.match(/^\s*-\s+/)) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(255, 120, 200);
          const cleanLine = line.replace(/^\s*-\s+/, "");
          const wrappedLines = pdf.splitTextToSize("- " + cleanLine, maxWidth - 15);
          wrappedLines.forEach((wLine: string) => {
            if (yPosition > pageHeight - margin) addBlackPage();
            pdf.text(wLine, margin + 10, yPosition);
            yPosition += 6;
          });
        }
        else if (line.match(/^\s*[-•]?\s*[A-D][\)\]]/)) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(255, 120, 200);
          const wrappedLines = pdf.splitTextToSize(line.trim(), maxWidth - 5);
          wrappedLines.forEach((wLine: string) => {
            if (yPosition > pageHeight - margin) addBlackPage();
            pdf.text(wLine, margin + 5, yPosition);
            yPosition += 6;
          });
        }
        else if (line.match(/Correct Answer:/i)) {
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255, 80, 180);
          if (yPosition > pageHeight - margin) addBlackPage();
          pdf.text(line.trim(), margin, yPosition);
          yPosition += 8;
        }
        else if (line.match(/Explanation:/i)) {
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(200, 150, 200);
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          wrappedLines.forEach((wLine: string) => {
            if (yPosition > pageHeight - margin) addBlackPage();
            pdf.text(wLine, margin, yPosition);
            yPosition += 6;
          });
          yPosition += 2;
        }
        else if (line.trim()) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(255, 120, 200);
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          wrappedLines.forEach((wLine: string) => {
            if (yPosition > pageHeight - margin) addBlackPage();
            pdf.text(wLine, margin, yPosition);
            yPosition += 6;
          });
        }
        else {
          yPosition += 4;
        }
      });

      pdf.save("notes.pdf");
      toast.success("Professional PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const isAnyFileExtracting = uploadedFiles.some((f) => f.isExtracting);

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      {/* Main Content Area */}
      <div className="flex-1 pb-32">
        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="mb-4 space-y-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted/50 backdrop-blur-sm rounded-xl p-3 border border-border/50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {uploadedFile.type === "pdf" ? (
                    <File className="w-4 h-4 text-neon-pink flex-shrink-0" />
                  ) : (
                    <FileImage className="w-4 h-4 text-neon-green flex-shrink-0" />
                  )}
                  <span className="text-sm text-foreground truncate">{uploadedFile.name}</span>
                  {uploadedFile.isExtracting && (
                    <div className="flex items-center gap-1 text-neon-purple">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-xs">Extracting...</span>
                    </div>
                  )}
                  {uploadedFile.extractedText && !uploadedFile.isExtracting && (
                    <span className="text-xs text-neon-green">Ready</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadedFile)}
                  className="text-muted-foreground hover:text-foreground hover:bg-destructive/20 p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Generated Notes Display */}
        {isLoading && (
          <div className="w-full bg-muted/50 backdrop-blur-sm rounded-2xl p-6 border border-neon-purple/30 mb-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-neon-purple" />
              <span className="text-2xl font-bold text-neon-purple animate-generating-pulse">
                Generating...
              </span>
            </div>
          </div>
        )}

        {generatedNotes && (
          <Card className={cn(
            "p-6 border-neon-purple/30 animate-scale-in mb-4",
            isLoading ? 'animate-box-flash-purple' : 'bg-card/80 backdrop-blur-sm shadow-[0_0_30px_rgba(180,0,255,0.3)]'
          )}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Generated Notes</h2>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="bg-foreground text-background border-foreground hover:bg-foreground/90 hover:scale-105 transition-all duration-200"
                >
                  Copy
                </Button>
                <Button
                  onClick={downloadPDF}
                  size="sm"
                  className="bg-background text-foreground border-2 border-foreground hover:bg-muted hover:scale-105 transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
            
            <div className="bg-background/50 p-6 rounded-xl border border-neon-purple/20">
              <div 
                className="whitespace-pre-wrap text-foreground font-sans text-base leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{
                  __html: formatNotesWithColors(generatedNotes, isLoading)
                }}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,image/*"
            multiple
            className="hidden"
          />

          <div className="flex items-center gap-3 relative">
            {/* Plus Button with Mode Popup */}
            <div className="relative">
              <ModePopup
                isOpen={isModePopupOpen}
                onClose={() => setIsModePopupOpen(false)}
                onSelectMode={generateNotes}
                isLoading={isLoading}
                currentMode={currentMode}
                disabled={isAnyFileExtracting || (!text.trim() && uploadedFiles.length === 0)}
              />
              <button
                onClick={() => {
                  if (!text.trim() && uploadedFiles.length === 0) {
                    fileInputRef.current?.click();
                  } else {
                    setIsModePopupOpen(!isModePopupOpen);
                  }
                }}
                disabled={isLoading}
                className={cn(
                  "flex-shrink-0 w-11 h-11 rounded-full bg-muted/90 backdrop-blur-sm flex items-center justify-center",
                  "transition-all duration-200 hover:bg-muted hover:scale-105 active:scale-95",
                  "border border-border/50",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <Plus className={cn(
                  "w-5 h-5 text-foreground transition-transform duration-200",
                  isModePopupOpen && "rotate-45"
                )} />
              </button>
            </div>

            {/* Input Field */}
            <div className="flex-1 relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your notes, text, or concepts..."
                disabled={isLoading}
                rows={1}
                className={cn(
                  "w-full min-h-[44px] max-h-32 px-4 py-3 pr-24 rounded-3xl resize-none",
                  "bg-muted/90 backdrop-blur-sm border border-border/50",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                  "transition-all duration-200",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  height: "auto",
                  overflow: "hidden",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 128) + "px";
                }}
              />

              {/* Right side icons */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all"
                  disabled={isLoading}
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-secondary text-secondary-foreground",
                    "hover:opacity-90 transition-opacity"
                  )}
                  disabled={isLoading}
                >
                  <AudioWaveform className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick hint text */}
          <p className="text-center text-xs text-muted-foreground mt-3">
            Tap + to select mode: Generate Notes, Summarise, Important Topics, or MCQs
          </p>
        </div>
      </div>
    </div>
  );
};
