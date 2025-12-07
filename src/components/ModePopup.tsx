import { useEffect, useRef } from "react";
import { FileText, BookOpen, Lightbulb, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "normal" | "important" | "mcqs" | "summarise";

interface ModePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: Mode) => void;
  isLoading: boolean;
  currentMode: Mode | null;
  disabled?: boolean;
}

const modeOptions = [
  {
    mode: "normal" as Mode,
    label: "Generate Notes",
    icon: FileText,
    color: "text-primary",
    borderColor: "border-primary/50",
    hoverBg: "hover:bg-primary/10",
    glowColor: "hover:shadow-[0_0_15px_rgba(34,255,94,0.3)]",
  },
  {
    mode: "summarise" as Mode,
    label: "Summarise Notes",
    icon: BookOpen,
    color: "text-neon-purple",
    borderColor: "border-neon-purple/50",
    hoverBg: "hover:bg-neon-purple/10",
    glowColor: "hover:shadow-[0_0_15px_rgba(180,0,255,0.3)]",
  },
  {
    mode: "important" as Mode,
    label: "Important Topics",
    icon: Lightbulb,
    color: "text-accent",
    borderColor: "border-accent/50",
    hoverBg: "hover:bg-accent/10",
    glowColor: "hover:shadow-[0_0_15px_rgba(255,72,200,0.3)]",
  },
  {
    mode: "mcqs" as Mode,
    label: "MCQs",
    icon: HelpCircle,
    color: "text-secondary",
    borderColor: "border-secondary/50",
    hoverBg: "hover:bg-secondary/10",
    glowColor: "hover:shadow-[0_0_15px_rgba(100,150,255,0.3)]",
  },
];

export const ModePopup = ({
  isOpen,
  onClose,
  onSelectMode,
  isLoading,
  currentMode,
  disabled = false,
}: ModePopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className={cn(
        "absolute bottom-full left-0 mb-3",
        "bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl",
        "p-3 shadow-xl",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
      )}
    >
      <div className="flex flex-col gap-2 min-w-[200px]">
        {modeOptions.map((option, index) => {
          const Icon = option.icon;
          const isCurrentLoading = isLoading && currentMode === option.mode;

          return (
            <button
              key={option.mode}
              onClick={() => {
                onSelectMode(option.mode);
                onClose();
              }}
              disabled={disabled || isLoading}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl",
                "bg-background/50 border",
                option.borderColor,
                option.color,
                option.hoverBg,
                option.glowColor,
                "transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                "animate-in fade-in-0 zoom-in-95",
              )}
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "backwards",
              }}
            >
              {isCurrentLoading ? (
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
              ) : (
                <Icon className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
