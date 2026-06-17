"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { supprimerCoursAction } from "../actions";

export function SupprimerCoursButton({
  coursId,
  titreCours,
}: {
  coursId: string;
  titreCours: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        `Supprimer le cours « ${titreCours} » ?\n\nAction irréversible — tous les blocs, devoirs, exercices et travaux des élèves seront définitivement supprimés.`,
      )
    )
      return;

    const formData = new FormData();
    formData.set("coursId", coursId);
    startTransition(() => supprimerCoursAction(formData));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="btn-danger gap-2"
    >
      <Trash2 className="h-4 w-4" />
      {isPending ? "Suppression…" : "Supprimer le cours"}
    </button>
  );
}
