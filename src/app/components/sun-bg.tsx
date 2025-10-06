"use client";

import { useEffect } from "react";

export default function SunBackground() {
  useEffect(() => {
    const PARALLAX_FACTOR = 0.45;
    let rafId: number | null = null;

    function onScroll() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const translate = Math.round(y * PARALLAX_FACTOR);
        document.documentElement.style.setProperty("--sun-translate", `${translate}px`);
      });
    }

    document.documentElement.style.setProperty("--sun-translate", `0px`);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="sun-static" aria-hidden="true">
      <span className="g g1" />
      <span className="g g2" />
      <span className="g g3" />
      <span className="g g4" />
    </div>
  );
}
