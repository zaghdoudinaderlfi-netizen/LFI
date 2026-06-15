"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Bouton de bascule thème clair / sombre. Le choix est mémorisé dans
 * localStorage et appliqué via la classe "dark" sur <html> (cf. script
 * d'initialisation dans app/layout.tsx, qui évite le flash au chargement).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [sombre, setSombre] = useState(true);

  useEffect(() => {
    setSombre(document.documentElement.classList.contains("dark"));
  }, []);

  function basculer() {
    const prochain = !sombre;
    document.documentElement.classList.toggle("dark", prochain);
    try {
      localStorage.setItem("theme", prochain ? "dark" : "light");
    } catch {
      // localStorage indisponible (navigation privée) : le choix ne sera
      // simplement pas mémorisé entre les sessions.
    }
    setSombre(prochain);
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={sombre ? "Passer au thème clair" : "Passer au thème sombre"}
      title={sombre ? "Thème clair" : "Thème sombre"}
      className={`btn-ghost !px-2 ${className}`}
    >
      {sombre ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
