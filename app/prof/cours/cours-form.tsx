"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { Matiere, Niveau, TypeCoursSimple } from "@prisma/client";
import { useToast } from "@/components/ui/toast";
import { NIVEAU_LABELS, MATIERE_LABELS } from "@/lib/classes-constants";

type CoursFormValues = {
  id?: string;
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
  publie: boolean;
  chapitre?: number | null;
};

type QuizDisponible = {
  id: string;
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
};

const TYPES_COURS: { value: TypeCoursSimple; emoji: string; label: string }[] = [
  { value: "HTML", emoji: "📄", label: "Fichier HTML" },
  { value: "PDF", emoji: "📕", label: "PDF" },
  { value: "WORD", emoji: "📝", label: "Word" },
  { value: "VIDEO", emoji: "🎬", label: "Vidéo" },
  { value: "QCM", emoji: "❓", label: "QCM" },
];

const ACCEPT_PAR_TYPE: Record<"HTML" | "PDF" | "WORD", string> = {
  HTML: ".html,.htm",
  PDF: ".pdf",
  WORD: ".docx",
};

const LABEL_FICHIER_PAR_TYPE: Record<"HTML" | "PDF" | "WORD", string> = {
  HTML: "Fichier HTML (.html)",
  PDF: "Fichier PDF (.pdf)",
  WORD: "Fichier Word (.docx)",
};

export function CoursForm({
  action,
  cours,
  submitLabel,
  quizzesDisponibles = [],
}: {
  action: (
    prevState: string | undefined,
    formData: FormData
  ) => Promise<string | undefined>;
  cours?: CoursFormValues;
  submitLabel: string;
  quizzesDisponibles?: QuizDisponible[];
}) {
  const [message, formAction, isPending] = useActionState(action, undefined);
  const enregistre = message === "Cours enregistré.";
  const [publie, setPublie] = useState(cours?.publie ?? false);
  const [typeSimple, setTypeSimple] = useState<TypeCoursSimple | null>(null);
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
          Choisis un format ci-dessous, ou laisse la sélection vide pour créer un cours{" "}
          <strong className="text-ink-primary">vierge</strong> et composer le contenu (blocs texte/image/vidéo,
          import Word ou PDF, cours interactif HTML…) depuis la page d&apos;édition.
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
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="field-label">Type de cours — optionnel</span>
            <div className="flex flex-wrap gap-2">
              {TYPES_COURS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={typeSimple === t.value}
                  onClick={() => setTypeSimple((cur) => (cur === t.value ? null : t.value))}
                  className={`btn-secondary ${
                    typeSimple === t.value ? "!border-neon-blue !text-neon-blue !bg-neon-blue/10" : ""
                  }`}
                >
                  <span aria-hidden="true">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <input type="hidden" name="type" value={typeSimple ?? ""} />

          {(typeSimple === "HTML" || typeSimple === "PDF" || typeSimple === "WORD") && (
            <div className="flex flex-col gap-1">
              <label htmlFor="fichier" className="field-label">
                {LABEL_FICHIER_PAR_TYPE[typeSimple]}
              </label>
              <input
                id="fichier"
                name="fichier"
                type="file"
                required
                accept={ACCEPT_PAR_TYPE[typeSimple]}
                className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
              />
              <p className="text-xs text-ink-muted">20 Mo max.</p>
            </div>
          )}

          {typeSimple === "VIDEO" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="videoUrl" className="field-label">
                Colle le lien YouTube ou Vimeo
              </label>
              <input
                id="videoUrl"
                name="videoUrl"
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                className="input"
              />
            </div>
          )}

          {typeSimple === "QCM" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="quizId" className="field-label">
                Quiz existant
              </label>
              {quizzesDisponibles.length > 0 ? (
                <select id="quizId" name="quizId" required defaultValue="" className="input">
                  <option value="" disabled>
                    — Choisir un quiz —
                  </option>
                  {quizzesDisponibles.map((q) => (
                    <option key={q.id} value={q.id}>
                      {MATIERE_LABELS[q.matiere]} · {NIVEAU_LABELS[q.niveau]} — {q.titre}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-ink-muted">Aucun quiz créé pour le moment.</p>
              )}
              <Link href="/prof/quiz/nouveau" className="link-muted w-fit text-sm">
                + Créer un nouveau quiz
              </Link>
            </div>
          )}
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
