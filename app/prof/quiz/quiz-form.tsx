"use client";

import { useActionState, useEffect, useState } from "react";
import type { Matiere, Niveau } from "@prisma/client";
import { useToast } from "@/components/ui/toast";

type QuizFormValues = {
  id?: string;
  titre: string;
  niveau: Niveau;
  matiere: Matiere;
  visibleEleves: boolean;
  chapitre?: number | null;
};

export function QuizForm({
  action,
  quiz,
  submitLabel,
}: {
  action: (
    prevState: string | undefined,
    formData: FormData
  ) => Promise<string | undefined>;
  quiz?: QuizFormValues;
  submitLabel: string;
}) {
  const [message, formAction, isPending] = useActionState(action, undefined);
  const enregistre = message === "Quiz enregistré.";
  const [visibleEleves, setVisibleEleves] = useState(quiz?.visibleEleves ?? false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!message) return;
    if (enregistre) {
      addToast({
        type: "success",
        message: visibleEleves ? "Quiz enregistré et visible par les élèves !" : "Quiz enregistré (masqué).",
      });
    } else {
      addToast({ type: "error", message });
    }
  }, [message, enregistre, visibleEleves, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {quiz?.id && <input type="hidden" name="id" value={quiz.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="titre" className="field-label">
          Titre
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          defaultValue={quiz?.titre}
          placeholder="ex. Les boucles for"
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
          defaultValue={quiz?.chapitre ?? ""}
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
            defaultValue={quiz?.niveau ?? "TROISIEME"}
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
            defaultValue={quiz?.matiere ?? "TECHNOLOGIE"}
            className="input"
          >
            <option value="TECHNOLOGIE">Technologie</option>
            <option value="SNT">SNT</option>
            <option value="NSI">NSI</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
        <input
          type="checkbox"
          name="visibleEleves"
          checked={visibleEleves}
          onChange={(e) => setVisibleEleves(e.target.checked)}
          className="h-4 w-4 rounded border-space-border accent-neon-blue"
        />
        Visible par les élèves du niveau correspondant
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
