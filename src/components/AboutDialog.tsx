import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AboutSection } from "./AboutSection";
import { cn } from "@/lib/utils";

interface AboutDialogProps {
  variant?: "default" | "icon";
}

export const AboutDialog = ({ variant = "default" }: AboutDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <button
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center",
              "text-foreground/80 hover:text-foreground",
              "hover:bg-background/50 transition-all duration-200"
            )}
          >
            <Info className="w-4 h-4" />
          </button>
        ) : (
          <Button
            variant="outline"
            className="border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary hover:scale-105 transition-all shadow-[0_0_10px_rgba(34,255,94,0.3)]"
          >
            <Info className="w-4 h-4 mr-2" />
            About
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border-border">
        <AboutSection />
      </DialogContent>
    </Dialog>
  );
};
