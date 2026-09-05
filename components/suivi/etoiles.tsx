"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ETOILES_MAX } from "@/lib/suivi-oral-constants";

/** Affichage lecture seule — accepte une valeur fractionnaire (ex. moyenne 3.4). */
export function EtoilesAffichage({
  valeur,
  max = ETOILES_MAX,
  taille = "h-4 w-4",
}: {
  valeur: number;
  max?: number;
  taille?: string;
}) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${valeur.toFixed(1)} sur ${max}`}>
      {Array.from({ length: max }).map((_, i) => {
        const fraction = Math.max(0, Math.min(1, valeur - i));
        return (
          <span key={i} className={`relative inline-block shrink-0 ${taille}`}>
            <Star className={`absolute inset-0 h-full w-full text-ink-muted/30`} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
              <Star className="h-full w-full fill-current text-amber-400" />
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Sélecteur interactif pour un formulaire (valeur entière 0-5, champ hidden `name`). */
export function EtoilesSelecteur({
  name,
  label,
  defaultValue = 0,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  const [valeur, setValeur] = useState(defaultValue);
  const [survol, setSurvol] = useState<number | null>(null);
  const affichee = survol ?? valeur;

  return (
    <div className="flex flex-col gap-1">
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-1" onMouseLeave={() => setSurvol(null)}>
        <input type="hidden" name={name} value={valeur} />
        {Array.from({ length: ETOILES_MAX }).map((_, i) => {
          const n = i + 1;
          const rempli = n <= affichee;
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setSurvol(n)}
              onClick={() => setValeur((actuelle) => (actuelle === n ? n - 1 : n))}
              className="p-0.5"
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
        <span className="ml-2 text-sm text-ink-muted">{valeur}/{ETOILES_MAX}</span>
      </div>
    </div>
  );
}
