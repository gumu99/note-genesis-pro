import { Sparkles } from "lucide-react";

export const Header = () => {
  return (
    <header className="text-center py-8 animate-fade-in">
      <div className="inline-flex items-center gap-2 mb-2">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
      </div>
      <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        AI NOTES GENERATOR
      </h1>
      <p className="text-muted-foreground text-lg">
        Student • Developer • Builder
      </p>
    </header>
  );
};
