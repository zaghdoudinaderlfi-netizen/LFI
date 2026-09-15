"use client";

import { useActionState, useEffect, useRef } from "react";
import { deposerFichierAction } from "./actions";

export function CasierUploadForm() {
  const [message, formAction, isPending] = useActionState(deposerFichierAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const ajoute = message === "Fichier ajouté.";

  useEffect(() => {
    if (ajoute) formRef.current?.reset();
  }, [ajoute]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="fichier" className="field-label">
          Déposer un fichier
        </label>
        <input
          id="fichier"
          name="fichier"
          type="file"
          required
          className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
        />
        <p className="text-xs text-ink-muted">PDF, image, document... 10 Mo maximum.</p>
      </div>
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Envoi..." : "Déposer"}
      </button>
      {message && !ajoute && (
        <p className="text-sm text-red-400 sm:basis-full" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
