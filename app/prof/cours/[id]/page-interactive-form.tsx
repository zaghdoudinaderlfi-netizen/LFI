"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { modifierPageInteractiveAction } from "./page-interactive-actions";

export function PageInteractiveForm({
  coursId,
  pageInteractive,
  titreInteractif,
  fichiersDisponibles,
}: {
  coursId: string;
  pageInteractive: string | null;
  titreInteractif: string | null;
  fichiersDisponibles: string[];
}) {
  const [message, formAction, isPending] = useActionState(modifierPageInteractiveAction, undefined);
  const { addToast } = useToast();

  useEffect(() => {
    if (!message) return;
    if (message === "Enregistré.") {
      addToast({ type: "success", message: "Page interactive mise à jour." });
    } else {
      addToast({ type: "error", message });
    }
  }, [message, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="coursId" value={coursId} />

      {/* Titre du chapitre */}
      <div className="flex flex-col gap-1">
        <label htmlFor="titreInteractif" className="field-label">
          Titre du chapitre <span className="text-ink-muted font-normal">(affiché sur la carte élève)</span>
        </label>
        <input
          id="titreInteractif"
          name="titreInteractif"
          type="text"
          defaultValue={titreInteractif ?? ""}
          placeholder="Ex : Chapitre 1 — Arithmétique, variables, instructions"
          className="input"
        />
      </div>

      {/* Sélection du fichier interactif */}
      <div className="flex flex-col gap-1">
        <label htmlFor="pageInteractive" className="field-label">
          Fichier HTML interactif (depuis <code className="text-neon-cyan">public/cours/</code>)
        </label>
        {fichiersDisponibles.length > 0 ? (
          <select
            id="pageInteractive"
            name="pageInteractive"
            defaultValue={pageInteractive ?? ""}
            className="input"
          >
            <option value="">— Aucun —</option>
            {fichiersDisponibles.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-ink-muted">
            Aucun fichier <code>.html</code> trouvé dans <code>public/cours/</code>.
          </p>
        )}
      </div>

      {fichiersDisponibles.length > 0 && (
        <button type="submit" disabled={isPending} className="btn-primary self-start">
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      )}
    </form>
  );
}
