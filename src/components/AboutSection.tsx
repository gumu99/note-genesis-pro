import { Card } from "@/components/ui/card";
import { Code, Music, Rocket } from "lucide-react";

export const AboutSection = () => {
  return (
    <Card className="p-8 mb-8 bg-card border-border animate-scale-in">
      <div className="max-w-3xl mx-auto space-y-6 text-foreground">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Built by a Student, For Students
          </h2>
          <p className="text-xl text-accent font-semibold">
            "Why pay for premium when you can build it yourself?" 🎯
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Music className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-2">The Origin Story</h3>
              <p className="text-muted-foreground leading-relaxed">
                Hi there! 👋 I'm a second-year Computer Science & Engineering (AI/ML) student at Brainware University.
                Like many students, I love music. Unlike many students, I got fed up with Spotify's constant premium prompts. 
                So naturally, I did what any developer would do—I built my own solution. 🎵
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                But why stop there? I realized students need more than just music. They need powerful tools to study smarter, 
                not harder. That's when this AI-powered note generator was born.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Rocket className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-2">Why I Built This</h3>
              <p className="text-muted-foreground leading-relaxed">
                Traditional note-taking is slow. Reading through textbooks is overwhelming. And let's be honest—most of us 
                leave studying until the last minute. 😅
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                This AI note generator transforms any study material into comprehensive, structured notes in seconds. 
                It's like having a personal tutor who never gets tired and explains everything in detail.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                From biology to computer science, from physics to humanities—if you can paste it, we can transform it into study gold. ✨
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Code className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-2">Tech Stack</h3>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <p>✓ React – UI framework</p>
                <p>✓ TypeScript – Type safety</p>
                <p>✓ Tailwind CSS – Styling</p>
                <p>✓ Gemini 2.5-Flash – AI</p>
                <p>✓ Lovable Cloud – Backend</p>
                <p>✓ Markdown – Formatting</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-border">
          <p className="text-lg text-muted-foreground italic mb-4">
            "The best way to learn is to build something you wish existed."
          </p>
          <p className="text-muted-foreground">
            🎓 2nd Year CSE Student • 🎵 Music Player Builder • 🤖 AI/ML Enthusiast
          </p>
          <p className="text-primary font-semibold mt-4">
            Built with 💙 by a student who refused to pay for premium
          </p>
          <p className="text-accent font-bold mt-2">
            Keep learning. Keep building. Keep growing. 🚀
          </p>
        </div>
      </div>
    </Card>
  );
};
