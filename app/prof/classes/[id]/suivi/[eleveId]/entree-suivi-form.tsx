"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { EtoilesSelecteur } from "@/components/suivi/etoiles";
import { CRITERE_LABELS } from "@/lib/suivi-oral-constants";
import { ajouterEntreeSuiviAction } from "../actions";

export function EntreeSuiviForm({ classeId, eleveId }: { classeId: string; eleveId: string }) {
  const [message, formAction, isPending] = useActionState(ajouterEntreeSuiviAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const etaitEnAttente = useRef(false);
  // Incrémenté après chaque ajout réussi pour forcer le remontage des
  // sélecteurs d'étoiles (leur état interne ne suit pas form.reset()).
  const [cle, setCle] = useState(0);

  useEffect(() => {
    if (etaitEnAttente.current && !isPending && !message) {
      formRef.current?.reset();
      setCle((c) => c + 1);
    }
    etaitEnAttente.current = isPending;
  }, [isPending, message]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="classeId" value={classeId} />
      <input type="hidden" name="eleveId" value={eleveId} />

      <EtoilesSelecteur key={`travail-${cle}`} name="travailFait" label={CRITERE_LABELS.travailFait} />
      <EtoilesSelecteur key={`compte-rendu-${cle}`} name="compteRendu" label={CRITERE_LABELS.compteRendu} />
      <EtoilesSelecteur key={`assiduite-${cle}`} name="assiduite" label={CRITERE_LABELS.assiduite} />

      <div className="flex flex-col gap-1">
        <label htmlFor="commentaire" className="field-label">
          Commentaire (optionnel)
        </label>
        <textarea
          id="commentaire"
          name="commentaire"
          rows={2}
          className="input"
          placeholder="ex. Très investi aujourd'hui..."
        />
      </div>

      {message && (
        <p className="text-sm text-red-400" role="alert">
          {message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Ajout..." : "Ajouter ce point"}
      </button>
    </form>
  );
}
