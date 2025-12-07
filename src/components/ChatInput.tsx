import { useState, useRef } from "react";
import { Plus, Mic, AudioWaveform } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlusClick: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput = ({
  value,
  onChange,
  onPlusClick,
  placeholder = "Ask anything...",
  disabled = false,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3 w-full max-w-2xl mx-auto">
      {/* Plus Button */}
      <button
        onClick={onPlusClick}
        disabled={disabled}
        className={cn(
          "flex-shrink-0 w-11 h-11 rounded-full bg-muted/80 flex items-center justify-center",
          "transition-all duration-200 hover:bg-muted hover:scale-105 active:scale-95",
          "border border-border/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Plus className="w-5 h-5 text-foreground" />
      </button>

      {/* Input Field */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full h-11 px-4 pr-24 rounded-full",
            "bg-muted/80 border border-border/50",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        {/* Right side icons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            disabled={disabled}
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "bg-secondary text-secondary-foreground",
              "hover:opacity-90 transition-opacity"
            )}
            disabled={disabled}
          >
            <AudioWaveform className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
