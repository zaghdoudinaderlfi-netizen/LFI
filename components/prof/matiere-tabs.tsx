"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { Matiere } from "@prisma/client";

const ONGLETS: { value: Matiere; label: string; couleur: string }[] = [
  { value: "TECHNOLOGIE", label: "Technologie", couleur: "neon-blue" },
  { value: "SNT", label: "SNT", couleur: "neon-cyan" },
  { value: "NSI", label: "NSI", couleur: "neon-violet" },
];

const CLE_STORAGE = "prof-matiere-filtre";

export function MatieresTabs({ matiereActive }: { matiereActive: Matiere | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Restaure le dernier onglet si aucun param n'est présent dans l'URL
    if (!searchParams.get("matiere")) {
      const saved = localStorage.getItem(CLE_STORAGE) as Matiere | null;
      if (saved && ONGLETS.some((o) => o.value === saved)) {
        router.replace(`/prof?matiere=${saved}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choisir(matiere: Matiere) {
    localStorage.setItem(CLE_STORAGE, matiere);
    router.push(`/prof?matiere=${matiere}`);
  }

  return (
    <div className="flex gap-1 rounded-xl border border-space-border bg-space-surface2/60 p-1 animate-fade-in-up">
      {ONGLETS.map(({ value, label }) => {
        const actif = matiereActive === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => choisir(value)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              actif
                ? "bg-space-surface shadow-sm text-ink-primary"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
