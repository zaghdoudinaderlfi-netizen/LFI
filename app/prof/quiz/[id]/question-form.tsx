"use client";

import { useActionState, useEffect, useRef } from "react";
import { ajouterQuestionAction } from "./questions-actions";

const LETTRES = ["A", "B", "C", "D"] as const;

export function QuestionForm({ quizId }: { quizId: string }) {
  const [message, formAction, isPending] = useActionState(ajouterQuestionAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const ajoutee = message === "Question ajoutée.";

  useEffect(() => {
    if (ajoutee) {
      formRef.current?.reset();
    }
  }, [ajoutee]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4"
    >
      <input type="hidden" name="quizId" value={quizId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="enonce-question" className="field-label">
          Question
        </label>
        <textarea
          id="enonce-question"
          name="enonce"
          rows={2}
          required
          placeholder="ex. Quelle instruction Python affiche du texte à l'écran ?"
          className="input"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["choixA", "choixB", "choixC", "choixD"] as const).map((name, i) => (
          <div key={name} className="flex flex-col gap-1">
            <label htmlFor={name} className="field-label">
              Choix {LETTRES[i]}
            </label>
            <input id={name} name={name} type="text" required className="input" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="bonneReponse" className="field-label">
            Bonne réponse
          </label>
          <select id="bonneReponse" name="bonneReponse" required defaultValue="0" className="input">
            {LETTRES.map((lettre, i) => (
              <option key={lettre} value={i}>
                {lettre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tempsLimiteSec" className="field-label">
            Temps limite (secondes)
          </label>
          <input
            id="tempsLimiteSec"
            name="tempsLimiteSec"
            type="number"
            min={5}
            max={120}
            step={1}
            required
            defaultValue={20}
            className="input"
          />
        </div>
      </div>

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Ajout..." : "Ajouter la question"}
      </button>

      {message && (
        <p className={`text-sm ${ajoutee ? "text-emerald-400" : "text-red-400"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
