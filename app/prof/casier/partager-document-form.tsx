"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Matiere } from "@prisma/client";
import { partagerDocumentAction } from "./actions";

export function PartagerDocumentForm({ matiere }: { matiere: Matiere }) {
  const [message, formAction, isPending] = useActionState(partagerDocumentAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const partage = message === "Document partagé.";

  useEffect(() => {
    if (partage) formRef.current?.reset();
  }, [partage]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
      <input type="hidden" name="matiere" value={matiere} />
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="fichier" className="field-label">
          Partager un document
        </label>
        <input
          id="fichier"
          name="fichier"
          type="file"
          required
          className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
        />
        <p className="text-xs text-ink-muted">Visible par tous les élèves de cette matière. 10 Mo maximum.</p>
      </div>
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Envoi..." : "Partager"}
      </button>
      {message && !partage && (
        <p className="text-sm text-red-400 sm:basis-full" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
