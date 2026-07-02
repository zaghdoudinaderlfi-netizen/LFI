"use client";

import { useActionState, useEffect, useState } from "react";
import type { Matiere, Niveau } from "@prisma/client";
import { useToast } from "@/components/ui/toast";

type CoursFormValues = {
  id?: string;
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
  publie: boolean;
  chapitre?: number | null;
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
  const [publie, setPublie] = useState(cours?.publie ?? false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!message) return;
    if (enregistre) {
      addToast({
        type: "success",
        message: publie ? "Cours enregistré et publié !" : "Cours enregistré (brouillon).",
      });
    } else {
      addToast({ type: "error", message });
    }
  }, [message, enregistre, publie, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {cours?.id && <input type="hidden" name="id" value={cours.id} />}

      {!cours?.id && (
        <p className="rounded-lg border border-space-border bg-space-surface2/60 p-3 text-sm text-ink-secondary">
          Le fichier est <strong className="text-ink-primary">optionnel</strong> : tu peux créer le cours avec
          seulement un titre, puis ajouter le contenu (blocs texte/image/vidéo, import Word ou PDF,
          cours interactif HTML…) depuis la page d&apos;édition.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="titre" className="field-label">
          Titre
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          defaultValue={cours?.titre}
          placeholder="ex. Les réseaux informatiques"
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="chapitre" className="field-label">
          Chapitre <span className="text-ink-muted font-normal">(numéro, optionnel)</span>
        </label>
        <input
          id="chapitre"
          name="chapitre"
          type="number"
          min={1}
          step={1}
          defaultValue={cours?.chapitre ?? ""}
          placeholder="ex. 1"
          className="input w-28"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="niveau" className="field-label">
            Niveau
          </label>
          <select
            id="niveau"
            name="niveau"
            required
            defaultValue={cours?.niveau ?? "TROISIEME"}
            className="input"
          >
            <option value="TROISIEME">3ème</option>
            <option value="SECONDE">2nde</option>
            <option value="PREMIERE">1ère</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="matiere" className="field-label">
            Matière
          </label>
          <select
            id="matiere"
            name="matiere"
            required
            defaultValue={cours?.matiere ?? "TECHNOLOGIE"}
            className="input"
          >
            <option value="TECHNOLOGIE">Technologie</option>
            <option value="SNT">SNT</option>
            <option value="NSI">NSI</option>
          </select>
        </div>
      </div>

      {!cours?.id && (
        <div className="flex flex-col gap-1">
          <label htmlFor="fichier" className="field-label">
            Contenu du cours — optionnel (Word ou PDF)
          </label>
          <input
            id="fichier"
            name="fichier"
            type="file"
            accept=".docx,.pdf"
            className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
          />
          <p className="text-xs text-ink-muted">
            .docx ou .pdf, 10 Mo max. Laisse vide pour créer un cours vierge.
          </p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
        <input
          type="checkbox"
          name="publie"
          checked={publie}
          onChange={(e) => setPublie(e.target.checked)}
          className="h-4 w-4 rounded border-space-border accent-neon-blue"
        />
        Publier ce cours (visible par les élèves du niveau correspondant)
      </label>

      {message && (
        <p
          className={`text-sm ${enregistre ? "text-emerald-400" : "text-red-400"}`}
          role="alert"
        >
          {message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary mt-2 self-start">
        {isPending ? "Enregistrement..." : submitLabel}
      </button>
    </form>
  );
}
