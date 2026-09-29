import { useEffect, useRef, useState, type RefObject } from "react";

/** true when the user asked the OS for reduced motion */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Visible-in-viewport flag, used to pause offscreen WebGL canvases. */
export function useInView<T extends Element>(
  rootMargin = "200px",
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView];
}

export function useIsMobile(breakpoint = 760) {
  const [m, setM] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const on = () => setM(window.innerWidth < breakpoint);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [breakpoint]);
  return m;
}

/** Max device pixel ratio for every canvas on the page. */
export const MAX_DPR = 1.5;
export const DPR: [number, number] = [1, MAX_DPR];

export const ACCENTS = {
  blue: "#2a4bff",
  magenta: "#ff2bd6",
  red: "#ff3b2f",
  yellow: "#ffd400",
} as const;
