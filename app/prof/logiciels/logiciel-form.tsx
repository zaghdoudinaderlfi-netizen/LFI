"use client";

import { useActionState, useEffect, useState } from "react";
import { ajouterLogicielAction } from "./actions";

export function LogicielForm() {
  const [message, formAction, isPending] = useActionState(ajouterLogicielAction, undefined);
  const [resetKey, setResetKey] = useState(0);
  const succes = message === "Logiciel ajouté.";

  useEffect(() => {
    if (succes) {
      setResetKey((k) => k + 1);
    }
  }, [succes]);

  return (
    <div className="flex flex-col gap-3">
      <form
        key={resetKey}
        action={formAction}
        className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="titre-logiciel" className="field-label">
            Titre
          </label>
          <input id="titre-logiciel" name="titre" type="text" required className="input" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description-logiciel" className="field-label">
            Description
          </label>
          <textarea
            id="description-logiciel"
            name="description"
            required
            rows={3}
            className="input resize-y"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="lien-logiciel" className="field-label">
            Lien de téléchargement (optionnel si un fichier est fourni)
          </label>
          <input
            id="lien-logiciel"
            name="lien"
            type="url"
            placeholder="https://..."
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fichier-logiciel" className="field-label">
            Ou fichier à héberger (optionnel si un lien est fourni)
          </label>
          <input
            id="fichier-logiciel"
            name="fichier"
            type="file"
            accept=".zip,.exe,.msi,.dmg,.deb,.appimage,.7z,.tar,.gz"
            className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
          />
          <p className="text-xs text-ink-muted">10 Mo maximum.</p>
        </div>

        <button type="submit" disabled={isPending} className="btn-primary self-start">
          {isPending ? "Ajout..." : "Ajouter le logiciel"}
        </button>
      </form>
      {message && (
        <p className={`text-sm ${succes ? "text-emerald-400" : "text-red-400"}`} role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
