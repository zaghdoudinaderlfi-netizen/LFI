"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { normaliserRecherche } from "@/lib/texte";

export type ItemRecherche = {
  id: string;
  titre: string;
  sousTitre: string;
  href: string;
  externe?: boolean;
};

export function RechercheCours({ items }: { items: ItemRecherche[] }) {
  const [terme, setTerme] = useState("");

  const resultats = useMemo(() => {
    const termeNormalise = normaliserRecherche(terme);
    if (!termeNormalise) return [];
    return items.filter((item) =>
      normaliserRecherche(`${item.titre} ${item.sousTitre}`).includes(termeNormalise)
    );
  }, [items, terme]);

  const recherche = terme.trim().length > 0;

  return (
    <div className="relative animate-fade-in-up">
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

      {recherche && (
        <div className="card absolute z-20 mt-2 w-full max-h-80 overflow-y-auto p-2">
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
        </div>
      )}
    </div>
  );
}
