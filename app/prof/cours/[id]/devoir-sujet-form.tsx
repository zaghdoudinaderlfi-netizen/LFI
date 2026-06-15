"use client";

import { useActionState, useEffect, useRef } from "react";
import { TypeExercice } from "@prisma/client";
import { definirSujetDevoirAction, definirSujetFormulaireAction } from "./devoirs-actions";

export function DevoirSujetForm({
  devoirId,
  coursId,
  type,
  aDejaSujet,
}: {
  devoirId: string;
  coursId: string;
  type: TypeExercice;
  aDejaSujet: boolean;
}) {
  const estFormulaire = type === TypeExercice.DEVOIR_PDF_FORMULAIRE;
  const action = estFormulaire ? definirSujetFormulaireAction : definirSujetDevoirAction;
  const [message, formAction, isPending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const ajoute = message === "Sujet ajouté.";

  useEffect(() => {
    if (ajoute) {
      formRef.current?.reset();
    }
  }, [ajoute]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3"
    >
      <input type="hidden" name="devoirId" value={devoirId} />
      <input type="hidden" name="coursId" value={coursId} />
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={`sujet-${devoirId}`} className="field-label">
          {estFormulaire
            ? aDejaSujet
              ? "Remplacer le PDF-formulaire"
              : "Ajouter le PDF-formulaire"
            : aDejaSujet
              ? "Remplacer le sujet"
              : "Ajouter un sujet (PDF ou image)"}
        </label>
        <input
          id={`sujet-${devoirId}`}
          name="sujet"
          type="file"
          accept={estFormulaire ? ".pdf" : ".pdf,.jpg,.jpeg,.png,.webp"}
          required
          className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
        />
      </div>
      <button type="submit" disabled={isPending} className="btn-secondary">
        {isPending ? "Envoi..." : aDejaSujet ? "Remplacer" : "Ajouter"}
      </button>
      {message && (
        <p
          className={`text-sm sm:basis-full ${ajoute ? "text-emerald-400" : "text-red-400"}`}
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
