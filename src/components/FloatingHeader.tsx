import { useState, useEffect } from "react";
import { Minus, UserPlus, Edit, MoreVertical, History, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DonateButton } from "./DonateButton";
import { AboutDialog } from "./AboutDialog";

interface FloatingHeaderProps {
  scrollProgress: number;
  showScrollDown?: boolean;
  onScrollDown?: () => void;
}

export const FloatingHeader = ({
  scrollProgress,
  showScrollDown = false,
  onScrollDown,
}: FloatingHeaderProps) => {
  // Calculate icon scale based on scroll (1 -> 0.7)
  const iconScale = Math.max(0.7, 1 - scrollProgress * 0.3);
  const iconOpacity = Math.max(0.6, 1 - scrollProgress * 0.4);

  return (
    <>
      {/* Left side - Collapse button */}
      <div
        className={cn(
          "fixed top-4 left-4 z-50",
          "transition-all duration-300 ease-out"
        )}
        style={{
          transform: `scale(${iconScale})`,
          opacity: iconOpacity,
        }}
      >
        <button
          className={cn(
            "w-11 h-11 rounded-full bg-muted/90 backdrop-blur-sm",
            "flex items-center justify-center",
            "border border-border/50",
            "transition-all duration-200",
            "hover:bg-muted hover:scale-110 active:scale-95",
            "shadow-lg"
          )}
        >
          <Minus className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Right side - Action icons */}
      <div
        className={cn(
          "fixed top-4 right-4 z-50",
          "flex items-center gap-2",
          "transition-all duration-300 ease-out"
        )}
        style={{
          transform: `scale(${iconScale})`,
          opacity: iconOpacity,
        }}
      >
        <div className="flex items-center bg-muted/90 backdrop-blur-sm rounded-full px-2 py-1.5 border border-border/50 shadow-lg">
          {/* History icon */}
          <button
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center",
              "text-foreground/80 hover:text-foreground",
              "hover:bg-background/50 transition-all duration-200",
              "hover:scale-110 active:scale-95"
            )}
          >
            <History className="w-4 h-4" />
          </button>

          {/* Donate */}
          <div className="hover:scale-110 active:scale-95 transition-transform duration-200">
            <DonateButton variant="icon" />
          </div>

          {/* About */}
          <div className="hover:scale-110 active:scale-95 transition-transform duration-200">
            <AboutDialog variant="icon" />
          </div>

          {/* More options */}
          <button
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center",
              "text-foreground/80 hover:text-foreground",
              "hover:bg-background/50 transition-all duration-200",
              "hover:scale-110 active:scale-95"
            )}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scroll down indicator */}
      {showScrollDown && (
        <button
          onClick={onScrollDown}
          className={cn(
            "fixed bottom-24 left-1/2 -translate-x-1/2 z-40",
            "w-10 h-10 rounded-full bg-muted/90 backdrop-blur-sm",
            "flex items-center justify-center",
            "border border-border/50",
            "transition-all duration-300",
            "hover:bg-muted hover:scale-110 active:scale-95",
            "shadow-lg",
            "animate-bounce"
          )}
        >
          <ChevronDown className="w-5 h-5 text-foreground" />
        </button>
      )}
    </>
  );
};
