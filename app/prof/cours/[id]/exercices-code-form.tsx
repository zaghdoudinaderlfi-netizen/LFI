"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { TypeExercice } from "@prisma/client";
import { TYPE_EXERCICE_CODE_LABELS, TYPES_EXERCICE_CODE } from "@/lib/exercices-code-constants";
import { creerExerciceCodeAction } from "./exercices-code-actions";

export function ExerciceCodeForm({ coursId }: { coursId: string }) {
  const [message, formAction, isPending] = useActionState(creerExerciceCodeAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const ajoute = message === "Exercice ajouté.";
  const [type, setType] = useState<(typeof TYPES_EXERCICE_CODE)[number]>(TypeExercice.PYTHON);
  const [modeExamen, setModeExamen] = useState(false);

  useEffect(() => {
    if (ajoute) {
      formRef.current?.reset();
      setType(TypeExercice.PYTHON);
      setModeExamen(false);
    }
  }, [ajoute]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4">
      <input type="hidden" name="coursId" value={coursId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="titre-exercice-code" className="field-label">
          Titre de l&apos;exercice
        </label>
        <input
          id="titre-exercice-code"
          name="titre"
          type="text"
          required
          placeholder="ex. Boucle for et affichage"
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="consigne-exercice-code" className="field-label">
          Consigne
        </label>
        <textarea
          id="consigne-exercice-code"
          name="consigne"
          rows={3}
          required
          placeholder="Décris ce que l'élève doit coder..."
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="type-exercice-code" className="field-label">
          Type d&apos;exercice
        </label>
        <select
          id="type-exercice-code"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as (typeof TYPES_EXERCICE_CODE)[number])}
          className="input"
        >
          {TYPES_EXERCICE_CODE.map((t) => (
            <option key={t} value={t}>
              {TYPE_EXERCICE_CODE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="codeDepart-exercice-code" className="field-label">
          Code de départ (optionnel)
        </label>
        <textarea
          id="codeDepart-exercice-code"
          name="codeDepart"
          rows={6}
          placeholder={`print("Bonjour, le monde !")`}
          className="input font-mono"
        />
      </div>

      {type === TypeExercice.PYTHON && (
        <div className="flex flex-col gap-1">
          <label htmlFor="sortieAttendue-exercice-code" className="field-label">
            Sortie attendue (correction automatique)
          </label>
          <textarea
            id="sortieAttendue-exercice-code"
            name="sortieAttendue"
            rows={4}
            required
            placeholder={`Bonjour, le monde !`}
            className="input font-mono"
          />
          <p className="text-xs text-ink-muted">
            La sortie du programme de l&apos;élève (ce qu&apos;affiche <code>print</code>) sera comparée à ce texte
            pour déterminer automatiquement la réussite.
          </p>
        </div>
      )}

      {type === TypeExercice.TURTLE && (
        <p className="text-xs text-ink-muted">
          Exercice de dessin (module turtle) : pas de correction automatique. Tu corriges manuellement (note +
          appréciation), avec éventuellement une capture du dessin de l&apos;élève.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="points-exercice-code" className="field-label">
            Barème (points)
          </label>
          <input
            id="points-exercice-code"
            name="points"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={10}
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dateLimite-exercice-code" className="field-label">
            Date limite (optionnel)
          </label>
          <input id="dateLimite-exercice-code" name="dateLimite" type="date" className="input" />
          <p className="text-xs text-ink-muted">Passé cette date, le dépôt se ferme automatiquement.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-space-border bg-space-surface p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-ink-primary">
          <input
            type="checkbox"
            name="modeExamen"
            checked={modeExamen}
            onChange={(e) => setModeExamen(e.target.checked)}
            className="h-4 w-4"
          />
          Mode examen (chrono + anti-triche)
        </label>
        <p className="text-xs text-ink-muted">
          Pendant le créneau choisi, les élèves ne peuvent pas copier-coller et sont automatiquement bloqués
          s&apos;ils quittent l&apos;écran (changement d&apos;onglet, minimisation) — seul toi pourras les
          débloquer.
        </p>

        {modeExamen && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="examenDebut-exercice-code" className="field-label">
                Début de l&apos;épreuve
              </label>
              <input
                id="examenDebut-exercice-code"
                name="examenDebut"
                type="datetime-local"
                required={modeExamen}
                className="input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="examenFin-exercice-code" className="field-label">
                Fin de l&apos;épreuve
              </label>
              <input
                id="examenFin-exercice-code"
                name="examenFin"
                type="datetime-local"
                required={modeExamen}
                className="input"
              />
            </div>
          </div>
        )}
      </div>

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Ajout..." : "Ajouter l'exercice"}
      </button>

      {message && (
        <p className={`text-sm ${ajoute ? "text-emerald-400" : "text-red-400"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
