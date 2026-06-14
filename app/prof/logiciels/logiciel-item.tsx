"use client";

import { useActionState } from "react";
import type { Logiciel } from "@prisma/client";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { formaterTaille } from "@/lib/fichiers";
import {
  ajouterFichierLogicielAction,
  deplacerLogicielAction,
  modifierLogicielAction,
  supprimerFichierLogicielAction,
  supprimerLogicielAction,
} from "./actions";

const champClasse =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400";
const labelClasse = "text-sm font-medium text-slate-700";

export function LogicielItem({ logiciel, index, total }: { logiciel: Logiciel; index: number; total: number }) {
  const [messageInfos, formActionInfos, isPendingInfos] = useActionState(modifierLogicielAction, undefined);
  const [messageFichier, formActionFichier, isPendingFichier] = useActionState(ajouterFichierLogicielAction, undefined);
  const [messageRetrait, formActionRetrait, isPendingRetrait] = useActionState(supprimerFichierLogicielAction, undefined);

  return (
    <li className="flex flex-col gap-4 rounded-md border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{logiciel.titre}</p>

        <div className="flex shrink-0 items-center gap-1">
          <form action={deplacerLogicielAction}>
            <input type="hidden" name="id" value={logiciel.id} />
            <input type="hidden" name="direction" value="haut" />
            <button
              type="submit"
              disabled={index === 0}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
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
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
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
              className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
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
          <label htmlFor={`titre-${logiciel.id}`} className={labelClasse}>
            Titre
          </label>
          <input
            id={`titre-${logiciel.id}`}
            name="titre"
            type="text"
            defaultValue={logiciel.titre}
            required
            className={champClasse}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`description-${logiciel.id}`} className={labelClasse}>
            Description
          </label>
          <textarea
            id={`description-${logiciel.id}`}
            name="description"
            defaultValue={logiciel.description}
            required
            rows={2}
            className={`${champClasse} resize-y`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`lien-${logiciel.id}`} className={labelClasse}>
            Lien de téléchargement
          </label>
          <input
            id={`lien-${logiciel.id}`}
            name="lien"
            type="url"
            placeholder="https://..."
            defaultValue={logiciel.lien ?? ""}
            className={champClasse}
          />
        </div>

        <button
          type="submit"
          disabled={isPendingInfos}
          className="self-start rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {isPendingInfos ? "Enregistrement..." : "Enregistrer"}
        </button>
        {messageInfos && (
          <p className={`text-sm ${messageInfos === "Modifications enregistrées." ? "text-green-600" : "text-red-600"}`} role="alert">
            {messageInfos}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-2 rounded-md bg-slate-50 p-3">
        {logiciel.fichierNom ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-sm text-slate-700">
              📦 {logiciel.fichierNom}
              {logiciel.fichierTaille != null && ` (${formaterTaille(logiciel.fichierTaille)})`}
            </p>
            <div className="flex items-center gap-3">
              <a
                href={`/api/logiciels/${logiciel.id}/fichier`}
                className="text-xs font-medium text-slate-500 hover:underline"
              >
                Télécharger
              </a>
              <form action={formActionRetrait}>
                <input type="hidden" name="id" value={logiciel.id} />
                <button
                  type="submit"
                  disabled={isPendingRetrait}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  Retirer le fichier
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Aucun fichier hébergé pour ce logiciel.</p>
        )}
        {messageRetrait && (
          <p className={`text-xs ${messageRetrait === "Fichier retiré." ? "text-green-600" : "text-red-600"}`} role="alert">
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
            className="rounded-md border border-slate-300 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm"
          />
          <button
            type="submit"
            disabled={isPendingFichier}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50"
          >
            {isPendingFichier ? "Envoi..." : logiciel.fichierNom ? "Remplacer le fichier" : "Ajouter un fichier"}
          </button>
        </form>
        {messageFichier && (
          <p className={`text-xs ${messageFichier === "Fichier ajouté." ? "text-green-600" : "text-red-600"}`} role="alert">
            {messageFichier}
          </p>
        )}
      </div>
    </li>
  );
}
