import { Header } from "@/components/Header";
import { GeneratorForm } from "@/components/GeneratorForm";
import { DonateButton } from "@/components/DonateButton";
import { AboutDialog } from "@/components/AboutDialog";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-end gap-2 mb-4">
          <DonateButton />
          <AboutDialog />
        </div>

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
    </div>
  );
};

export default Index;
