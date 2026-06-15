"use client";

import { useActionState, useEffect, useRef } from "react";
import { remplacerContenuAction } from "../actions";

export function ContenuForm({ coursId }: { coursId: string }) {
  const [message, formAction, isPending] = useActionState(remplacerContenuAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const remplace = message === "Contenu remplacé.";

  useEffect(() => {
    if (remplace) {
      formRef.current?.reset();
    }
  }, [remplace]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
      <input type="hidden" name="coursId" value={coursId} />
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="fichier-contenu" className="field-label">
          Remplacer le contenu (Word ou PDF)
        </label>
        <input
          id="fichier-contenu"
          name="fichier"
          type="file"
          accept=".docx,.pdf"
          required
          className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
        />
        <p className="text-xs text-ink-muted">
          Le nouveau fichier remplace entièrement le contenu actuel du cours
          (texte, images ou PDF). 10 Mo maximum.
        </p>
      </div>
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Import..." : "Remplacer"}
      </button>
      {message && (
        <p
          className={`text-sm sm:basis-full ${remplace ? "text-emerald-400" : "text-red-400"}`}
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
