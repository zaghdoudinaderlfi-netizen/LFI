"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import type { Matiere, Niveau, TypeCoursSimple } from "@prisma/client";
import { useToast } from "@/components/ui/toast";
import { NIVEAU_LABELS, MATIERE_LABELS } from "@/lib/classes-constants";
import { remplacerContenuCoursSimpleAction } from "./contenu-simple-actions";

const ACCEPT_PAR_TYPE: Record<"HTML" | "PDF" | "WORD", string> = {
  HTML: ".html,.htm",
  PDF: ".pdf",
  WORD: ".docx",
};

const LABEL_FICHIER_PAR_TYPE: Record<"HTML" | "PDF" | "WORD", string> = {
  HTML: "Remplacer le fichier HTML (.html)",
  PDF: "Remplacer le fichier PDF (.pdf)",
  WORD: "Remplacer le fichier Word (.docx)",
};

type QuizDisponible = {
  id: string;
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
};

export function ContenuSimpleForm({
  coursId,
  typeSimple,
  quizzesDisponibles = [],
}: {
  coursId: string;
  typeSimple: TypeCoursSimple;
  quizzesDisponibles?: QuizDisponible[];
}) {
  const [message, formAction, isPending] = useActionState(remplacerContenuCoursSimpleAction, undefined);
  const { addToast } = useToast();

  useEffect(() => {
    if (!message) return;
    if (message === "Contenu remplacé.") {
      addToast({ type: "success", message });
    } else {
      addToast({ type: "error", message });
    }
  }, [message, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-3" encType="multipart/form-data">
      <input type="hidden" name="coursId" value={coursId} />

      {(typeSimple === "HTML" || typeSimple === "PDF" || typeSimple === "WORD") && (
        <div className="flex flex-col gap-1">
          <label htmlFor="fichier" className="field-label">
            {LABEL_FICHIER_PAR_TYPE[typeSimple]}
          </label>
          <input
            id="fichier"
            name="fichier"
            type="file"
            required
            accept={ACCEPT_PAR_TYPE[typeSimple]}
            className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
          />
          <p className="text-xs text-ink-muted">20 Mo max.</p>
        </div>
      )}

      {typeSimple === "VIDEO" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="videoUrl" className="field-label">
            Nouveau lien YouTube ou Vimeo
          </label>
          <input
            id="videoUrl"
            name="videoUrl"
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            className="input"
          />
        </div>
      )}

      {typeSimple === "QCM" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="quizId" className="field-label">
            Associer un autre quiz
          </label>
          {quizzesDisponibles.length > 0 ? (
            <select id="quizId" name="quizId" required defaultValue="" className="input">
              <option value="" disabled>
                — Choisir un quiz —
              </option>
              {quizzesDisponibles.map((q) => (
                <option key={q.id} value={q.id}>
                  {MATIERE_LABELS[q.matiere]} · {NIVEAU_LABELS[q.niveau]} — {q.titre}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-ink-muted">Aucun autre quiz disponible.</p>
          )}
          <Link href="/prof/quiz/nouveau" className="link-muted w-fit text-sm">
            + Créer un nouveau quiz
          </Link>
        </div>
      )}

      {message && (
        <p className={`text-sm ${message === "Contenu remplacé." ? "text-emerald-400" : "text-red-400"}`} role="alert">
          {message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-secondary self-start">
        {isPending ? "Enregistrement..." : "Remplacer"}
      </button>
    </form>
  );
}
