"use client";

import { useActionState, useEffect, useState } from "react";
import type { TypeBloc } from "@prisma/client";
import { EditeurTexte } from "@/components/blocs/editeur-texte";
import { OUTILS_ACTIVITE, TYPE_BLOC_LABELS } from "@/lib/blocs-constants";
import { ajouterBlocAction } from "./blocs-actions";

const TYPES_BLOC: TypeBloc[] = ["TEXTE", "IMAGE", "PDF", "VIDEO", "ACTIVITE", "LIEN", "EDITEUR_PYTHON"];

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
        <p className={`text-sm ${succes ? "text-emerald-400" : "text-red-400"}`} role="alert">
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
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4">
      <input type="hidden" name="coursId" value={coursId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="type-bloc" className="field-label">
          Type de bloc
        </label>
        <select
          id="type-bloc"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as TypeBloc)}
          className="input"
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
          <label className="field-label">Contenu</label>
          <EditeurTexte name="contenu" />
        </div>
      )}

      {(type === "IMAGE" || type === "PDF") && (
        <div className="flex flex-col gap-1">
          <label htmlFor="fichier-bloc" className="field-label">
            {type === "IMAGE" ? "Image (PNG, JPG, GIF, WEBP, SVG)" : "Fichier PDF"}
          </label>
          <input
            id="fichier-bloc"
            name="fichier"
            type="file"
            accept={type === "IMAGE" ? "image/png,image/jpeg,image/gif,image/webp,image/svg+xml" : "application/pdf"}
            required
            className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
          />
          <p className="text-xs text-ink-muted">10 Mo maximum.</p>
        </div>
      )}

      {type === "VIDEO" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="lien-video" className="field-label">
            Lien YouTube ou Vimeo
          </label>
          <input
            id="lien-video"
            name="lien"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            required
            className="input"
          />
          <p className="text-xs text-ink-muted">
            La vidéo s&apos;affiche directement dans la page du cours, sans que l&apos;élève ait besoin de quitter la page.
          </p>
        </div>
      )}

      {type === "EDITEUR_PYTHON" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="consigne-python" className="field-label">
              Consigne
            </label>
            <textarea
              id="consigne-python"
              name="consigne"
              rows={3}
              required
              placeholder="Décris ce que l'élève doit coder..."
              className="input"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="codeDepart-python" className="field-label">
              Code de départ (optionnel)
            </label>
            <textarea
              id="codeDepart-python"
              name="codeDepart"
              rows={6}
              placeholder={`print("Bonjour, le monde !")`}
              className="input font-mono"
            />
          </div>

          <p className="text-xs text-ink-muted">
            L&apos;élève pourra modifier le code, l&apos;exécuter (Python de base et module turtle) et voir
            le résultat directement dans la page. Aucune note n&apos;est associée à ce bloc.
          </p>
        </>
      )}

      {type === "ACTIVITE" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="outil-activite" className="field-label">
              Outil
            </label>
            <select
              id="outil-activite"
              name="outil"
              value={outil}
              onChange={(e) => setOutil(e.target.value)}
              className="input"
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
              <label htmlFor="outil-autre" className="field-label">
                Nom de l&apos;outil
              </label>
              <input id="outil-autre" name="outilAutre" type="text" required className="input" />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="lien-activite" className="field-label">
              Lien de l&apos;activité
            </label>
            <input
              id="lien-activite"
              name="lien"
              type="url"
              placeholder="https://..."
              required
              className="input"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="titre-activite" className="field-label">
              Titre du bouton (optionnel)
            </label>
            <input
              id="titre-activite"
              name="titre"
              type="text"
              placeholder={`Ouvrir l'activité ${OUTILS_ACTIVITE[outil as keyof typeof OUTILS_ACTIVITE] ?? "…"}`}
              className="input"
            />
          </div>
        </>
      )}

      {type === "LIEN" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="titre-lien" className="field-label">
              Titre du lien
            </label>
            <input id="titre-lien" name="titre" type="text" required className="input" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="lien-lien" className="field-label">
              Adresse (URL)
            </label>
            <input
              id="lien-lien"
              name="lien"
              type="url"
              placeholder="https://..."
              required
              className="input"
            />
          </div>
        </>
      )}

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Ajout..." : "Ajouter le bloc"}
      </button>
    </form>
  );
}
