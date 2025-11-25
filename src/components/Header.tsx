import { useEffect, useRef } from "react";

export const Header = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.6;
    }
  }, []);

  return (
    <header className="text-center py-8 animate-fade-in">
      <div className="inline-flex items-center gap-2 mb-2">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-16 h-16 object-contain"
        >
          <source src="/header-animation.mp4" type="video/mp4" />
        </video>
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
