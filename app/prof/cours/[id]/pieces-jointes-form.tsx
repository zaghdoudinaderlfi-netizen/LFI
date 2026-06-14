"use client";

import { useActionState, useEffect, useRef } from "react";
import { ajouterPieceJointeAction } from "./pieces-jointes-actions";

export function PieceJointeForm({ coursId }: { coursId: string }) {
  const [message, formAction, isPending] = useActionState(ajouterPieceJointeAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const ajoute = message === "Fichier ajouté.";

  useEffect(() => {
    if (ajoute) {
      formRef.current?.reset();
    }
  }, [ajoute]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
      <input type="hidden" name="coursId" value={coursId} />
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="fichier" className="text-sm font-medium text-slate-700">
          Ajouter un fichier
        </label>
        <input
          id="fichier"
          name="fichier"
          type="file"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <p className="text-xs text-slate-400">
          PDF, image, document, code... 10 Mo maximum.
        </p>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Envoi..." : "Ajouter"}
      </button>
      {message && !ajoute && (
        <p className="text-sm text-red-600 sm:basis-full" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
