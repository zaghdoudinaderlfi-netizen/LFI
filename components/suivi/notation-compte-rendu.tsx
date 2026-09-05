"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { ETOILES_MAX } from "@/lib/suivi-oral-constants";
import { noterCompteRenduAction } from "@/app/prof/comptes-rendus/[id]/actions";

/** Notation en étoiles d'un dépôt, envoyée au clic (pas de bouton "valider"). */
export function NotationCompteRendu({
  id,
  valeurInitiale,
}: {
  id: string;
  valeurInitiale: number | null;
}) {
  const [valeur, setValeur] = useState(valeurInitiale ?? 0);
  const [survol, setSurvol] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const affichee = survol ?? valeur;

  function noter(n: number) {
    setValeur(n);
    startTransition(async () => {
      await noterCompteRenduAction(id, n);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1" onMouseLeave={() => setSurvol(null)}>
      {Array.from({ length: ETOILES_MAX }).map((_, i) => {
        const n = i + 1;
        const rempli = n <= affichee;
        return (
          <button
            key={n}
            type="button"
            disabled={isPending}
            onMouseEnter={() => setSurvol(n)}
            onClick={() => noter(valeur === n ? n - 1 : n)}
            className="p-0.5 disabled:opacity-60"
            aria-label={`${n} étoile${n > 1 ? "s" : ""} sur ${ETOILES_MAX}`}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                rempli ? "fill-current text-amber-400" : "text-ink-muted/40"
              }`}
            />
          </button>
        );
      })}
      <span className="ml-1 text-sm text-ink-muted">{valeur}/{ETOILES_MAX}</span>
    </div>
  );
}
