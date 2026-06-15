"use client";

import { useActionState } from "react";
import type { Logiciel } from "@prisma/client";
import { ArrowUp, ArrowDown, Package, Trash2 } from "lucide-react";
import { formaterTaille } from "@/lib/fichiers";
import {
  ajouterFichierLogicielAction,
  deplacerLogicielAction,
  modifierLogicielAction,
  supprimerFichierLogicielAction,
  supprimerLogicielAction,
} from "./actions";

export function LogicielItem({ logiciel, index, total }: { logiciel: Logiciel; index: number; total: number }) {
  const [messageInfos, formActionInfos, isPendingInfos] = useActionState(modifierLogicielAction, undefined);
  const [messageFichier, formActionFichier, isPendingFichier] = useActionState(ajouterFichierLogicielAction, undefined);
  const [messageRetrait, formActionRetrait, isPendingRetrait] = useActionState(supprimerFichierLogicielAction, undefined);

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-space-border bg-space-surface2/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-primary">{logiciel.titre}</p>

        <div className="flex shrink-0 items-center gap-1">
          <form action={deplacerLogicielAction}>
            <input type="hidden" name="id" value={logiciel.id} />
            <input type="hidden" name="direction" value="haut" />
            <button
              type="submit"
              disabled={index === 0}
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-space-surface2 hover:text-ink-primary disabled:opacity-30"
              aria-label="Monter"
              title="Monter"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
          <form action={deplacerLogicielAction}>
            <input type="hidden" name="id" value={logiciel.id} />
            <input type="hidden" name="direction" value="bas" />
            <button
              type="submit"
              disabled={index === total - 1}
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-space-surface2 hover:text-ink-primary disabled:opacity-30"
              aria-label="Descendre"
              title="Descendre"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </form>
          <form
            action={supprimerLogicielAction}
            onSubmit={(e) => {
              if (!window.confirm("Supprimer ce logiciel ?")) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={logiciel.id} />
            <button
              type="submit"
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
              aria-label="Supprimer"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <form action={formActionInfos} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={logiciel.id} />

        <div className="flex flex-col gap-1">
          <label htmlFor={`titre-${logiciel.id}`} className="field-label">
            Titre
          </label>
          <input
            id={`titre-${logiciel.id}`}
            name="titre"
            type="text"
            defaultValue={logiciel.titre}
            required
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`description-${logiciel.id}`} className="field-label">
            Description
          </label>
          <textarea
            id={`description-${logiciel.id}`}
            name="description"
            defaultValue={logiciel.description}
            required
            rows={2}
            className="input resize-y"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`lien-${logiciel.id}`} className="field-label">
            Lien de téléchargement
          </label>
          <input
            id={`lien-${logiciel.id}`}
            name="lien"
            type="url"
            placeholder="https://..."
            defaultValue={logiciel.lien ?? ""}
            className="input"
          />
        </div>

        <button type="submit" disabled={isPendingInfos} className="btn-secondary self-start">
          {isPendingInfos ? "Enregistrement..." : "Enregistrer"}
        </button>
        {messageInfos && (
          <p className={`text-sm ${messageInfos === "Modifications enregistrées." ? "text-emerald-400" : "text-red-400"}`} role="alert">
            {messageInfos}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-2 rounded-lg border border-space-border bg-space-surface/60 p-3">
        {logiciel.fichierNom ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 truncate text-sm text-ink-secondary">
              <Package className="h-4 w-4 shrink-0 text-neon-cyan" />
              {logiciel.fichierNom}
              {logiciel.fichierTaille != null && ` (${formaterTaille(logiciel.fichierTaille)})`}
            </p>
            <div className="flex items-center gap-3">
              <a href={`/api/logiciels/${logiciel.id}/fichier`} className="link-muted text-xs font-medium">
                Télécharger
              </a>
              <form action={formActionRetrait}>
                <input type="hidden" name="id" value={logiciel.id} />
                <button
                  type="submit"
                  disabled={isPendingRetrait}
                  className="text-xs font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                >
                  Retirer le fichier
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-muted">Aucun fichier hébergé pour ce logiciel.</p>
        )}
        {messageRetrait && (
          <p className={`text-xs ${messageRetrait === "Fichier retiré." ? "text-emerald-400" : "text-red-400"}`} role="alert">
            {messageRetrait}
          </p>
        )}

        <form action={formActionFichier} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={logiciel.id} />
          <input
            name="fichier"
            type="file"
            accept=".zip,.exe,.msi,.dmg,.deb,.appimage,.7z,.tar,.gz"
            required
            className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
          />
          <button type="submit" disabled={isPendingFichier} className="btn-secondary">
            {isPendingFichier ? "Envoi..." : logiciel.fichierNom ? "Remplacer le fichier" : "Ajouter un fichier"}
          </button>
        </form>
        {messageFichier && (
          <p className={`text-xs ${messageFichier === "Fichier ajouté." ? "text-emerald-400" : "text-red-400"}`} role="alert">
            {messageFichier}
          </p>
        )}
      </div>
    </li>
  );
}
