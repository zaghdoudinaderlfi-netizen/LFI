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
        <label htmlFor="fichier-contenu" className="text-sm font-medium text-slate-700">
          Remplacer le contenu (Word ou PDF)
        </label>
        <input
          id="fichier-contenu"
          name="fichier"
          type="file"
          accept=".docx,.pdf"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <p className="text-xs text-slate-400">
          Le nouveau fichier remplace entièrement le contenu actuel du cours
          (texte, images ou PDF). 10 Mo maximum.
        </p>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Import..." : "Remplacer"}
      </button>
      {message && (
        <p
          className={`text-sm sm:basis-full ${remplace ? "text-green-600" : "text-red-600"}`}
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
