"use client";

import { useActionState, useEffect, useState } from "react";
import type { TypeBloc } from "@prisma/client";
import { EditeurTexte } from "@/components/blocs/editeur-texte";
import { OUTILS_ACTIVITE, TYPE_BLOC_LABELS } from "@/lib/blocs-constants";
import { ajouterBlocAction } from "./blocs-actions";

const TYPES_BLOC: TypeBloc[] = ["TEXTE", "IMAGE", "PDF", "VIDEO", "ACTIVITE", "LIEN", "EDITEUR_PYTHON"];

const champClasseMono =
  "rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400";

const champClasse =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400";
const labelClasse = "text-sm font-medium text-slate-700";

export function BlocsForm({ coursId }: { coursId: string }) {
  const [message, formAction, isPending] = useActionState(ajouterBlocAction, undefined);
  const [resetKey, setResetKey] = useState(0);
  const succes = message === "Bloc ajouté.";

  useEffect(() => {
    if (succes) {
      setResetKey((k) => k + 1);
    }
  }, [succes]);

  return (
    <div className="flex flex-col gap-3">
      <ChampsBlocs key={resetKey} coursId={coursId} formAction={formAction} isPending={isPending} />
      {message && (
        <p className={`text-sm ${succes ? "text-green-600" : "text-red-600"}`} role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

function ChampsBlocs({
  coursId,
  formAction,
  isPending,
}: {
  coursId: string;
  formAction: (formData: FormData) => void;
  isPending: boolean;
}) {
  const [type, setType] = useState<TypeBloc>("TEXTE");
  const [outil, setOutil] = useState<string>("VITTASCIENCE");

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4">
      <input type="hidden" name="coursId" value={coursId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="type-bloc" className={labelClasse}>
          Type de bloc
        </label>
        <select
          id="type-bloc"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as TypeBloc)}
          className={champClasse}
        >
          {TYPES_BLOC.map((t) => (
            <option key={t} value={t}>
              {TYPE_BLOC_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {type === "TEXTE" && (
        <div className="flex flex-col gap-1">
          <label className={labelClasse}>Contenu</label>
          <EditeurTexte name="contenu" />
        </div>
      )}

      {(type === "IMAGE" || type === "PDF") && (
        <div className="flex flex-col gap-1">
          <label htmlFor="fichier-bloc" className={labelClasse}>
            {type === "IMAGE" ? "Image (PNG, JPG, GIF, WEBP, SVG)" : "Fichier PDF"}
          </label>
          <input
            id="fichier-bloc"
            name="fichier"
            type="file"
            accept={type === "IMAGE" ? "image/png,image/jpeg,image/gif,image/webp,image/svg+xml" : "application/pdf"}
            required
            className={`${champClasse} file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm`}
          />
          <p className="text-xs text-slate-400">10 Mo maximum.</p>
        </div>
      )}

      {type === "VIDEO" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="lien-video" className={labelClasse}>
            Lien YouTube ou Vimeo
          </label>
          <input
            id="lien-video"
            name="lien"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            required
            className={champClasse}
          />
          <p className="text-xs text-slate-400">
            La vidéo s&apos;affiche directement dans la page du cours, sans que l&apos;élève ait besoin de quitter la page.
          </p>
        </div>
      )}

      {type === "EDITEUR_PYTHON" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="consigne-python" className={labelClasse}>
              Consigne
            </label>
            <textarea
              id="consigne-python"
              name="consigne"
              rows={3}
              required
              placeholder="Décris ce que l'élève doit coder..."
              className={champClasse}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="codeDepart-python" className={labelClasse}>
              Code de départ (optionnel)
            </label>
            <textarea
              id="codeDepart-python"
              name="codeDepart"
              rows={6}
              placeholder={`print("Bonjour, le monde !")`}
              className={champClasseMono}
            />
          </div>

          <p className="text-xs text-slate-400">
            L&apos;élève pourra modifier le code, l&apos;exécuter (Python de base et module turtle) et voir
            le résultat directement dans la page. Aucune note n&apos;est associée à ce bloc.
          </p>
        </>
      )}

      {type === "ACTIVITE" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="outil-activite" className={labelClasse}>
              Outil
            </label>
            <select
              id="outil-activite"
              name="outil"
              value={outil}
              onChange={(e) => setOutil(e.target.value)}
              className={champClasse}
            >
              {Object.entries(OUTILS_ACTIVITE).map(([cle, label]) => (
                <option key={cle} value={cle}>
                  {label}
                </option>
              ))}
              <option value="AUTRE">Autre outil…</option>
            </select>
          </div>

          {outil === "AUTRE" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="outil-autre" className={labelClasse}>
                Nom de l&apos;outil
              </label>
              <input id="outil-autre" name="outilAutre" type="text" required className={champClasse} />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="lien-activite" className={labelClasse}>
              Lien de l&apos;activité
            </label>
            <input
              id="lien-activite"
              name="lien"
              type="url"
              placeholder="https://..."
              required
              className={champClasse}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="titre-activite" className={labelClasse}>
              Titre du bouton (optionnel)
            </label>
            <input
              id="titre-activite"
              name="titre"
              type="text"
              placeholder={`Ouvrir l'activité ${OUTILS_ACTIVITE[outil as keyof typeof OUTILS_ACTIVITE] ?? "…"}`}
              className={champClasse}
            />
          </div>
        </>
      )}

      {type === "LIEN" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="titre-lien" className={labelClasse}>
              Titre du lien
            </label>
            <input id="titre-lien" name="titre" type="text" required className={champClasse} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="lien-lien" className={labelClasse}>
              Adresse (URL)
            </label>
            <input
              id="lien-lien"
              name="lien"
              type="url"
              placeholder="https://..."
              required
              className={champClasse}
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Ajout..." : "Ajouter le bloc"}
      </button>
    </form>
  );
}
