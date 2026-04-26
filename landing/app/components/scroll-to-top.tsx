import { ChevronUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";

const SHOW_AFTER_PX = 400;

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!visible) return null;

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="fixed right-6 z-50 h-12 w-12 rounded-full border border-border/80 bg-background/95 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/80 hover:bg-accent bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-8 md:right-8"
      onClick={scrollTop}
      aria-label="Наверх"
    >
      <ChevronUp className="h-6 w-6" aria-hidden />
    </Button>
  );
}
