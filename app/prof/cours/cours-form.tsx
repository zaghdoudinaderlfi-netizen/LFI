"use client";

import { useActionState } from "react";
import type { Matiere, Niveau } from "@prisma/client";

type CoursFormValues = {
  id?: string;
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
  publie: boolean;
};

export function CoursForm({
  action,
  cours,
  submitLabel,
}: {
  action: (
    prevState: string | undefined,
    formData: FormData
  ) => Promise<string | undefined>;
  cours?: CoursFormValues;
  submitLabel: string;
}) {
  const [message, formAction, isPending] = useActionState(action, undefined);
  const enregistre = message === "Cours enregistré.";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {cours?.id && <input type="hidden" name="id" value={cours.id} />}

      {!cours?.id && (
        <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          Importe directement un fichier Word (.docx) ou PDF : son contenu
          deviendra celui du cours. Les fichiers Word sont convertis en texte
          mis en forme (titres, paragraphes, images) ; les fichiers PDF sont
          affichés dans une visionneuse intégrée. Tu pourras ajouter des
          pièces jointes et des devoirs une fois le cours créé.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="titre" className="text-sm font-medium text-slate-700">
          Titre
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          defaultValue={cours?.titre}
          placeholder="ex. Les réseaux informatiques"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="niveau" className="text-sm font-medium text-slate-700">
            Niveau
          </label>
          <select
            id="niveau"
            name="niveau"
            required
            defaultValue={cours?.niveau ?? "TROISIEME"}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="TROISIEME">3ème</option>
            <option value="SECONDE">2nde</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="matiere" className="text-sm font-medium text-slate-700">
            Matière
          </label>
          <select
            id="matiere"
            name="matiere"
            required
            defaultValue={cours?.matiere ?? "TECHNOLOGIE"}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="TECHNOLOGIE">Technologie</option>
            <option value="SNT">SNT</option>
          </select>
        </div>
      </div>

      {!cours?.id && (
        <div className="flex flex-col gap-1">
          <label htmlFor="fichier" className="text-sm font-medium text-slate-700">
            Contenu du cours (Word ou PDF)
          </label>
          <input
            id="fichier"
            name="fichier"
            type="file"
            accept=".docx,.pdf"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <p className="text-xs text-slate-400">
            Fichier .docx ou .pdf, 10 Mo maximum.
          </p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="publie"
          defaultChecked={cours?.publie ?? false}
          className="h-4 w-4 rounded border-slate-300 focus:ring-slate-400"
        />
        Publier ce cours (visible par les élèves du niveau correspondant)
      </label>

      {message && (
        <p
          className={`text-sm ${enregistre ? "text-green-600" : "text-red-600"}`}
          role="alert"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Enregistrement..." : submitLabel}
      </button>
    </form>
  );
}
