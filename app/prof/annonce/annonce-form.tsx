"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Megaphone } from "lucide-react";
import { creerAnnonceAction } from "./actions";

export function AnnonceForm() {
  const [message, formAction, isPending] = useActionState(creerAnnonceAction, undefined);
  const [resetKey, setResetKey] = useState(0);
  const etaitEnAttente = useRef(false);

  useEffect(() => {
    if (etaitEnAttente.current && !isPending && !message) {
      setResetKey((k) => k + 1);
    }
    etaitEnAttente.current = isPending;
  }, [isPending, message]);

  return (
    <form key={resetKey} action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="message-annonce" className="field-label">
          Message affiché aux élèves
        </label>
        <textarea
          id="message-annonce"
          name="message"
          required
          rows={4}
          maxLength={2000}
          placeholder="ex. Contrôle vendredi sur le chapitre 5 — apportez votre calculatrice !"
          className="input resize-y"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="fichier-annonce" className="field-label">
          Document à télécharger (optionnel)
        </label>
        <input
          id="fichier-annonce"
          name="fichier"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.csv,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
        />
        <p className="text-xs text-ink-muted">10 Mo maximum.</p>
      </div>

      {message && (
        <p className="text-sm text-red-400" role="alert">
          {message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary self-start inline-flex items-center gap-2">
        <Megaphone className="h-4 w-4" />
        {isPending ? "Diffusion..." : "Diffuser aux élèves"}
      </button>
      <p className="text-xs text-ink-muted">
        Publier une nouvelle annonce remplace automatiquement celle actuellement affichée.
      </p>
    </form>
  );
}
