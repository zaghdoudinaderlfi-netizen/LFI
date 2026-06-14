"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { creerDevoirAction } from "./devoirs-actions";

export function DevoirForm({ coursId }: { coursId: string }) {
  const [message, formAction, isPending] = useActionState(creerDevoirAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const ajoute = message === "Devoir ajouté.";
  const [type, setType] = useState<"DEVOIR_PDF" | "DEVOIR_PDF_FORMULAIRE">("DEVOIR_PDF");
  const estFormulaire = type === "DEVOIR_PDF_FORMULAIRE";

  useEffect(() => {
    if (ajoute) {
      formRef.current?.reset();
      setType("DEVOIR_PDF");
    }
  }, [ajoute]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="coursId" value={coursId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="titre" className="text-sm font-medium text-slate-700">
          Titre du devoir
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          placeholder="ex. Devoir maison n°2"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="consigne" className="text-sm font-medium text-slate-700">
          Consigne
        </label>
        <textarea
          id="consigne"
          name="consigne"
          rows={4}
          required
          placeholder="Décris le travail à rendre..."
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-slate-700">
          Type de devoir
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "DEVOIR_PDF" | "DEVOIR_PDF_FORMULAIRE")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="DEVOIR_PDF">Envoi de fichier (l&apos;élève dépose un document)</option>
          <option value="DEVOIR_PDF_FORMULAIRE">PDF-formulaire (rempli en ligne par l&apos;élève)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="points" className="text-sm font-medium text-slate-700">
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
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dateLimite" className="text-sm font-medium text-slate-700">
            Date limite (optionnel)
          </label>
          <input
            id="dateLimite"
            name="dateLimite"
            type="date"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sujet" className="text-sm font-medium text-slate-700">
          {estFormulaire
            ? "PDF-formulaire (avec champs remplissables) — obligatoire"
            : "Sujet à donner aux élèves (PDF ou image, optionnel)"}
        </label>
        <input
          key={estFormulaire ? "formulaire" : "fichier"}
          id="sujet"
          name="sujet"
          type="file"
          accept={estFormulaire ? ".pdf" : ".pdf,.jpg,.jpeg,.png,.webp"}
          required={estFormulaire}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <p className="text-xs text-slate-400">
          {estFormulaire
            ? "PDF avec des champs de formulaire (zones de texte, cases à cocher) préparés avec LibreOffice, Acrobat... 10 Mo maximum."
            : "PDF ou image, 10 Mo maximum."}
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Ajout..." : "Ajouter le devoir"}
      </button>

      {message && (
        <p className={`text-sm ${ajoute ? "text-green-600" : "text-red-600"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
