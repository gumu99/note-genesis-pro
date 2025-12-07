import { Header } from "@/components/Header";
import { GeneratorForm } from "@/components/GeneratorForm";
import { FloatingHeader } from "@/components/FloatingHeader";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const Index = () => {
  const { scrollProgress, isAtBottom, scrollToBottom } = useScrollProgress();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Floating Header with scroll-based animations */}
      <FloatingHeader
        scrollProgress={scrollProgress}
        showScrollDown={!isAtBottom}
        onScrollDown={scrollToBottom}
      />

      {/* Top blur overlay */}
      <div
        className="fixed top-0 left-0 right-0 h-24 pointer-events-none z-30"
        style={{
          background: "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)",
          opacity: Math.min(scrollProgress * 2, 0.8),
        }}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-4xl">
        <Header />

        <p className="text-center text-muted-foreground mb-8">
          Try my other creations here:{" "}
          <a
            href="https://whatsapp.com/channel/0029VbBa1Es2ER6mgaO0Am2V"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            WhatsApp Channel
          </a>
        </p>

        <GeneratorForm />
      </div>

      {/* Bottom blur overlay */}
      <div
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-30"
        style={{
          background: "linear-gradient(to top, hsl(var(--background)) 60%, transparent 100%)",
        }}
      />
    </div>
  );
};

export default Index;
