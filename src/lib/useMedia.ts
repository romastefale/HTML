import { useEffect, useState } from "react";

/** Subscribe to a media query (same helper as the fork's site/src/useMedia.ts). */
export const useMediaQuery = (query: string): boolean => {
  const [match, setMatch] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return match;
};

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
