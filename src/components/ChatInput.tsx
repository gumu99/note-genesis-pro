import { useState, useRef } from "react";
import { Plus, AudioWaveform } from "lucide-react";
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
            "w-full h-12 px-5 pr-12 rounded-full",
            "bg-muted/80 border-2 border-primary/60",
            "text-foreground placeholder:text-muted-foreground/70",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            "transition-all duration-200",
            "text-base",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        {/* Right side icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          <button
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center",
              "bg-secondary text-secondary-foreground",
              "hover:opacity-90 transition-opacity hover:scale-105 active:scale-95"
            )}
            disabled={disabled}
          >
            <AudioWaveform className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
