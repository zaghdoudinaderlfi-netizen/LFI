"use client";

import { useActionState } from "react";
import { ChampFormulaire } from "@/lib/formulaire-champs";
import { type CamaradeClasse } from "@/lib/groupes";
import { soumettreFormulaireAction } from "./formulaire-actions";
import { CoequipierSelecteur } from "./coequipier-selecteur";
import { FormulairePdfOverlay } from "./formulaire-pdf";

export function FormulaireForm({
  exerciceId,
  slug,
  pdfUrl,
  champs,
  reponses,
  camarades,
  coequipiers,
}: {
  exerciceId: string;
  slug: string;
  pdfUrl: string;
  champs: ChampFormulaire[];
  reponses: Record<string, string | boolean>;
  camarades: CamaradeClasse[];
  coequipiers: string[];
}) {
  const [message, formAction, isPending] = useActionState(soumettreFormulaireAction, undefined);
  const envoye = message === "Formulaire envoyé.";

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3">
      <input type="hidden" name="exerciceId" value={exerciceId} />
      <input type="hidden" name="slug" value={slug} />

      <p className="text-sm text-slate-500">
        Remplis directement les champs du document ci-dessous, puis envoie tes réponses.
      </p>

      <FormulairePdfOverlay pdfUrl={pdfUrl} champs={champs} reponses={reponses} />

      <CoequipierSelecteur camarades={camarades} defautCoequipiers={coequipiers} />

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Envoi..." : "Envoyer mes réponses"}
      </button>

      {message && (
        <p className={`text-sm ${envoye ? "text-green-600" : "text-red-600"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
