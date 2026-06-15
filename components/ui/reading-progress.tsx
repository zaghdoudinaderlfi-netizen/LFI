"use client";

import { useEffect, useState } from "react";

/**
 * Fine barre de progression de lecture, fixée en haut de l'écran.
 * Purement décorative (aria-hidden) : reflète la position de défilement
 * dans la page, utile pour se repérer dans un cours long.
 */
export function ReadingProgress() {
  const [progres, setProgres] = useState(0);

  useEffect(() => {
    function majProgres() {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const max = scrollHeight - clientHeight;
      setProgres(max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0);
    }

    majProgres();
    window.addEventListener("scroll", majProgres, { passive: true });
    window.addEventListener("resize", majProgres);
    return () => {
      window.removeEventListener("scroll", majProgres);
      window.removeEventListener("resize", majProgres);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-1 bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-violet transition-[width] duration-150 ease-out"
      style={{ width: `${progres}%` }}
    />
  );
}
