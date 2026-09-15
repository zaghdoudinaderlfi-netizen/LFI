"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { normaliserRecherche } from "@/lib/texte";

export type ItemRecherche = {
  id: string;
  titre: string;
  sousTitre: string;
  href: string;
  externe?: boolean;
};

type Position = { top: number; left: number; width: number };

export function RechercheCours({ items }: { items: ItemRecherche[] }) {
  const [terme, setTerme] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const conteneurRef = useRef<HTMLDivElement>(null);

  const resultats = useMemo(() => {
    const termeNormalise = normaliserRecherche(terme);
    if (!termeNormalise) return [];
    return items.filter((item) =>
      normaliserRecherche(`${item.titre} ${item.sousTitre}`).includes(termeNormalise)
    );
  }, [items, terme]);

  const recherche = terme.trim().length > 0;

  // Le menu déroulant est rendu dans un portail (voir plus bas) : aucun
  // positionnement CSS relatif au flux normal ne peut alors le placer sous
  // l'input, il faut calculer ses coordonnées écran nous-mêmes.
  useEffect(() => {
    if (!recherche) return;

    function recalculer() {
      const rect = conteneurRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    }

    recalculer();
    window.addEventListener("resize", recalculer);
    window.addEventListener("scroll", recalculer, true);
    return () => {
      window.removeEventListener("resize", recalculer);
      window.removeEventListener("scroll", recalculer, true);
    };
  }, [recherche]);

  return (
    <div ref={conteneurRef} className="relative animate-fade-in-up">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
          placeholder="Rechercher un cours ou un chapitre…"
          className="input w-full pl-9"
          aria-label="Rechercher un cours ou un chapitre"
        />
      </div>

      {recherche &&
        position &&
        createPortal(
          // Rendu directement dans <body> plutôt qu'à sa place naturelle
          // dans le flux : place le menu hors de portée de tout contexte
          // d'empilement CSS créé par un élément de la page (ex: un
          // conteneur animé avec `transform`, comme les onglets matière
          // juste en dessous) qui le ferait sinon passer derrière.
          <div
            // Fond opaque (pas la classe .card, translucide avec flou —
            // pensée pour une carte de contenu, pas pour un menu qui doit
            // rester lisible par-dessus n'importe quel contenu arbitraire en
            // dessous). Même traitement que le menu utilisateur dans
            // app-shell.tsx.
            className="fixed z-50 max-h-80 overflow-y-auto rounded-2xl border-2 border-space-border bg-space-surface p-2 shadow-2xl"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            {resultats.length === 0 ? (
              <p className="p-3 text-sm text-ink-muted">
                Aucun cours trouvé pour « {terme.trim()} ».
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {resultats.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      target={item.externe ? "_blank" : undefined}
                      rel={item.externe ? "noopener noreferrer" : undefined}
                      className="flex flex-col gap-0.5 rounded-lg px-3 py-2 hover:bg-space-surface2"
                    >
                      <span className="text-sm font-medium text-ink-primary">{item.titre}</span>
                      <span className="text-xs text-ink-muted">{item.sousTitre}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
