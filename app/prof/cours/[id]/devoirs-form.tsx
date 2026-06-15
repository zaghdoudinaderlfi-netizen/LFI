"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MODE_REMISE_FORMULAIRE_LABELS, type ModeRemiseFormulaireValeur } from "@/lib/formulaire-champs";
import { creerDevoirAction } from "./devoirs-actions";

export function DevoirForm({ coursId }: { coursId: string }) {
  const [message, formAction, isPending] = useActionState(creerDevoirAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const ajoute = message === "Devoir ajouté.";
  const [type, setType] = useState<"DEVOIR_PDF" | "DEVOIR_PDF_FORMULAIRE">("DEVOIR_PDF");
  const [modeRemise, setModeRemise] = useState<ModeRemiseFormulaireValeur>("EN_LIGNE");
  const estFormulaire = type === "DEVOIR_PDF_FORMULAIRE";
  const enLigne = modeRemise === "EN_LIGNE";

  useEffect(() => {
    if (ajoute) {
      formRef.current?.reset();
      setType("DEVOIR_PDF");
      setModeRemise("EN_LIGNE");
    }
  }, [ajoute]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="coursId" value={coursId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="titre" className="field-label">
          Titre du devoir
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          placeholder="ex. Devoir maison n°2"
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="consigne" className="field-label">
          Consigne
        </label>
        <textarea
          id="consigne"
          name="consigne"
          rows={4}
          required
          placeholder="Décris le travail à rendre..."
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="field-label">
          Type de devoir
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "DEVOIR_PDF" | "DEVOIR_PDF_FORMULAIRE")}
          className="input"
        >
          <option value="DEVOIR_PDF">Envoi de fichier (l&apos;élève dépose un document)</option>
          <option value="DEVOIR_PDF_FORMULAIRE">PDF-formulaire</option>
        </select>
      </div>

      {estFormulaire && (
        <div className="flex flex-col gap-1">
          <label htmlFor="modeRemise" className="field-label">
            Mode de remise du formulaire
          </label>
          <select
            id="modeRemise"
            name="modeRemise"
            value={modeRemise}
            onChange={(e) => setModeRemise(e.target.value as ModeRemiseFormulaireValeur)}
            className="input"
          >
            {Object.entries(MODE_REMISE_FORMULAIRE_LABELS).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="points" className="field-label">
            Barème (points)
          </label>
          <input
            id="points"
            name="points"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={20}
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dateLimite" className="field-label">
            Date limite (optionnel)
          </label>
          <input
            id="dateLimite"
            name="dateLimite"
            type="date"
            className="input"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sujet" className="field-label">
          {estFormulaire
            ? enLigne
              ? "PDF-formulaire (avec champs remplissables) — obligatoire"
              : "PDF-formulaire à télécharger par l'élève — obligatoire"
            : "Sujet à donner aux élèves (PDF ou image, optionnel)"}
        </label>
        <input
          key={estFormulaire ? "formulaire" : "fichier"}
          id="sujet"
          name="sujet"
          type="file"
          accept={estFormulaire ? ".pdf" : ".pdf,.jpg,.jpeg,.png,.webp"}
          required={estFormulaire}
          className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
        />
        <p className="text-xs text-ink-muted">
          {estFormulaire
            ? enLigne
              ? "PDF avec des champs de formulaire (zones de texte, cases à cocher) préparés avec LibreOffice, Acrobat... 10 Mo maximum."
              : "PDF que l'élève télécharge, remplit dans son lecteur PDF, puis redépose. 10 Mo maximum."
            : "PDF ou image, 10 Mo maximum."}
        </p>
      </div>

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Ajout..." : "Ajouter le devoir"}
      </button>

      {message && (
        <p className={`text-sm ${ajoute ? "text-emerald-400" : "text-red-400"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
