"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { supprimerQuizAction } from "../actions";

export function SupprimerQuizButton({
  quizId,
  titreQuiz,
}: {
  quizId: string;
  titreQuiz: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        `Supprimer le quiz « ${titreQuiz} » ?\n\nAction irréversible — toutes les questions et tentatives des élèves seront définitivement supprimées.`,
      )
    )
      return;

    const formData = new FormData();
    formData.set("quizId", quizId);
    startTransition(() => supprimerQuizAction(formData));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="btn-danger gap-2"
    >
      <Trash2 className="h-4 w-4" />
      {isPending ? "Suppression…" : "Supprimer le quiz"}
    </button>
  );
}
