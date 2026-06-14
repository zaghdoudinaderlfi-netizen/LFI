"use client";

import { useActionState, useEffect, useState } from "react";
import { ajouterLogicielAction } from "./actions";

const champClasse =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400";
const labelClasse = "text-sm font-medium text-slate-700";

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
      <form key={resetKey} action={formAction} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="titre-logiciel" className={labelClasse}>
            Titre
          </label>
          <input id="titre-logiciel" name="titre" type="text" required className={champClasse} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description-logiciel" className={labelClasse}>
            Description
          </label>
          <textarea
            id="description-logiciel"
            name="description"
            required
            rows={3}
            className={`${champClasse} resize-y`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="lien-logiciel" className={labelClasse}>
            Lien de téléchargement (optionnel si un fichier est fourni)
          </label>
          <input
            id="lien-logiciel"
            name="lien"
            type="url"
            placeholder="https://..."
            className={champClasse}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fichier-logiciel" className={labelClasse}>
            Ou fichier à héberger (optionnel si un lien est fourni)
          </label>
          <input
            id="fichier-logiciel"
            name="fichier"
            type="file"
            accept=".zip,.exe,.msi,.dmg,.deb,.appimage,.7z,.tar,.gz"
            className={`${champClasse} file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm`}
          />
          <p className="text-xs text-slate-400">10 Mo maximum.</p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Ajout..." : "Ajouter le logiciel"}
        </button>
      </form>
      {message && (
        <p className={`text-sm ${succes ? "text-green-600" : "text-red-600"}`} role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
