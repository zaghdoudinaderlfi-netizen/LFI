"use client";

import { useState } from "react";
import { MAX_COEQUIPIERS, NOM_CHAMP_COEQUIPIERS, type CamaradeClasse } from "@/lib/groupes";
import { formaterNomComplet } from "@/lib/utilisateurs";

export function CoequipierSelecteur({
  camarades,
  defautCoequipiers = [],
}: {
  camarades: CamaradeClasse[];
  defautCoequipiers?: string[];
}) {
  const [selection, setSelection] = useState<string[]>(defautCoequipiers);

  if (camarades.length === 0) return null;

  function basculer(id: string) {
    setSelection((courante) =>
      courante.includes(id)
        ? courante.filter((c) => c !== id)
        : courante.length < MAX_COEQUIPIERS
          ? [...courante, id]
          : courante
    );
  }

  return (
    <fieldset className="flex flex-col gap-1 rounded-md border border-slate-200 p-3">
      <legend className="px-1 text-sm font-medium text-slate-700">
        Travail en groupe ({MAX_COEQUIPIERS} coéquipiers maximum, facultatif)
      </legend>
      <p className="text-xs text-slate-400">
        Sélectionne tes coéquipiers : le rendu, la note et l&apos;appréciation s&apos;appliqueront à tout le groupe.
      </p>
      <div className="flex flex-col gap-1">
        {camarades.map((camarade) => {
          const coche = selection.includes(camarade.id);
          const desactive = !coche && selection.length >= MAX_COEQUIPIERS;
          return (
            <label
              key={camarade.id}
              className={`flex items-center gap-2 text-sm ${desactive ? "text-slate-400" : "text-slate-700"}`}
            >
              <input
                type="checkbox"
                name={NOM_CHAMP_COEQUIPIERS}
                value={camarade.id}
                checked={coche}
                disabled={desactive}
                onChange={() => basculer(camarade.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {formaterNomComplet(camarade)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
