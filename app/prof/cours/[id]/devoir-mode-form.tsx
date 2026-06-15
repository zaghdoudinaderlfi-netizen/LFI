"use client";

import { useActionState } from "react";
import { MODE_REMISE_FORMULAIRE_LABELS, type ModeRemiseFormulaireValeur } from "@/lib/formulaire-champs";
import { definirModeRemiseFormulaireAction } from "./devoirs-actions";

// PDF-formulaire : choix du mode de remise pour un devoir existant (Mode A
// "en ligne" ou Mode B "téléchargement", cf. ModeRemiseFormulaire).
export function DevoirModeForm({
  devoirId,
  coursId,
  modeRemise,
}: {
  devoirId: string;
  coursId: string;
  modeRemise: ModeRemiseFormulaireValeur;
}) {
  const [message, formAction, isPending] = useActionState(definirModeRemiseFormulaireAction, undefined);
  const ok = message === "Mode de remise mis à jour.";

  return (
    <form action={formAction} className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
      <input type="hidden" name="devoirId" value={devoirId} />
      <input type="hidden" name="coursId" value={coursId} />
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={`mode-${devoirId}`} className="field-label">
          Mode de remise
        </label>
        <select
          id={`mode-${devoirId}`}
          name="modeRemise"
          defaultValue={modeRemise}
          className="input"
        >
          {Object.entries(MODE_REMISE_FORMULAIRE_LABELS).map(([valeur, label]) => (
            <option key={valeur} value={valeur}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={isPending} className="btn-secondary">
        {isPending ? "..." : "Mettre à jour"}
      </button>
      {message && (
        <p className={`text-sm sm:basis-full ${ok ? "text-emerald-400" : "text-red-400"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
