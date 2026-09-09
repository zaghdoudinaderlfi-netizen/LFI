"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { supprimerCompteRenduAction } from "./actions";

/**
 * Suppression d'un dépôt, utilisable depuis la liste (`compact`) comme
 * depuis la page de détail. Même schéma que SupprimerCoursButton /
 * SupprimerQuizButton : confirmation navigateur, puis action serveur.
 */
export function SupprimerCompteRenduButton({
  compteRenduId,
  libelle,
  compact = false,
}: {
  compteRenduId: string;
  /** Ce qu'on nomme dans la confirmation : « le dépôt de … ». */
  libelle: string;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        `Supprimer le compte-rendu de ${libelle} ?\n\nAction irréversible — le travail déposé et sa note seront définitivement supprimés.`,
      )
    )
      return;

    const formData = new FormData();
    formData.set("id", compteRenduId);
    startTransition(() => supprimerCompteRenduAction(formData));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title="Supprimer ce compte-rendu"
      aria-label={`Supprimer le compte-rendu de ${libelle}`}
      className={compact ? "btn-danger gap-2 px-3" : "btn-danger gap-2"}
    >
      <Trash2 className="h-4 w-4" />
      {compact ? (isPending ? "…" : "") : isPending ? "Suppression…" : "Supprimer le compte-rendu"}
    </button>
  );
}
