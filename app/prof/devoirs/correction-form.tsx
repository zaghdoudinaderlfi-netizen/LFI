"use client";

import { useActionState } from "react";
import { noterSoumissionAction } from "./actions";

export function CorrectionForm({
  soumissionId,
  bareme,
}: {
  soumissionId: string;
  bareme: number;
}) {
  const [message, formAction, isPending] = useActionState(noterSoumissionAction, undefined);
  const corrige = message === "Copie corrigée.";

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
      <input type="hidden" name="id" value={soumissionId} />

      <div className="flex flex-col gap-1">
        <label htmlFor={`note-${soumissionId}`} className="text-sm font-medium text-slate-700">
          Note (/{bareme})
        </label>
        <input
          id={`note-${soumissionId}`}
          name="note"
          type="number"
          min={0}
          max={bareme}
          step="0.5"
          required
          className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={`feedback-${soumissionId}`} className="text-sm font-medium text-slate-700">
          Commentaire (facultatif)
        </label>
        <input
          id={`feedback-${soumissionId}`}
          name="feedback"
          type="text"
          placeholder="Visible par l'élève"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Envoi..." : "Valider"}
      </button>

      {message && (
        <p
          className={`text-sm sm:basis-full ${corrige ? "text-green-600" : "text-red-600"}`}
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
