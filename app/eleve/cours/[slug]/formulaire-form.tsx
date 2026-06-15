"use client";

import { useActionState, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { ChampFormulaire } from "@/lib/formulaire-champs";
import { type CamaradeClasse } from "@/lib/groupes";
import { soumettreFormulaireAction } from "./formulaire-actions";
import { CoequipierSelecteur } from "./coequipier-selecteur";
import { FormulairePdfOverlay } from "./formulaire-pdf";
import { useToast } from "@/components/ui/toast";
import { SuccessBurst } from "@/components/ui/success-burst";

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
  const { addToast } = useToast();
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (envoye) {
      addToast({ type: "success", message: "Réponses envoyées avec succès !" });
      setShowBurst(true);
      const timeout = setTimeout(() => setShowBurst(false), 700);
      return () => clearTimeout(timeout);
    }
    if (message) {
      addToast({ type: "error", message });
    }
  }, [envoye, message, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-3">
      <input type="hidden" name="exerciceId" value={exerciceId} />
      <input type="hidden" name="slug" value={slug} />

      <p className="text-sm text-ink-secondary">
        Remplis directement les champs du document ci-dessous, puis envoie tes réponses.
      </p>

      <FormulairePdfOverlay pdfUrl={pdfUrl} champs={champs} reponses={reponses} />

      <CoequipierSelecteur camarades={camarades} defautCoequipiers={coequipiers} />

      <div className="flex items-center gap-2 self-start">
        <button type="submit" disabled={isPending} className="btn-primary self-start">
          <Send className="h-4 w-4" />
          {isPending ? "Envoi..." : "Envoyer mes réponses"}
        </button>
        <SuccessBurst show={showBurst} />
      </div>

      {message && (
        <p className={`text-sm ${envoye ? "text-emerald-400" : "text-red-400"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
