"use client";

import { useActionState, useEffect, useRef } from "react";
import { deposerSoumissionAction } from "./soumissions-actions";

export function DevoirSoumissionForm({
  exerciceId,
  slug,
}: {
  exerciceId: string;
  slug: string;
}) {
  const [message, formAction, isPending] = useActionState(deposerSoumissionAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const depose = message === "Devoir déposé.";

  useEffect(() => {
    if (depose) {
      formRef.current?.reset();
    }
  }, [depose]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3"
    >
      <input type="hidden" name="exerciceId" value={exerciceId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={`fichier-${exerciceId}`} className="text-sm font-medium text-slate-700">
          Déposer ton fichier
        </label>
        <input
          id={`fichier-${exerciceId}`}
          name="fichier"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <p className="text-xs text-slate-400">PDF ou photo (jpg, png, webp), 10 Mo maximum.</p>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Envoi..." : "Déposer"}
      </button>
      {message && (
        <p
          className={`text-sm sm:basis-full ${depose ? "text-green-600" : "text-red-600"}`}
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
