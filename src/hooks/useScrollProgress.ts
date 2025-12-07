import { useState, useEffect, useCallback } from "react";

export const useScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / 200, 1) : 0;
    
    setScrollProgress(progress);
    setIsAtTop(scrollTop < 50);
    setIsAtBottom(scrollTop + window.innerHeight >= document.documentElement.scrollHeight - 50);
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return {
    scrollProgress,
    isAtTop,
    isAtBottom,
    scrollToBottom,
  };
};
