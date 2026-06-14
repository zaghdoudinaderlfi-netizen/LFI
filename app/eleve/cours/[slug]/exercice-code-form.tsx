"use client";

import { PythonRunner } from "@/components/python/python-runner";
import { soumettreExerciceCodeAction } from "./exercices-code-actions";

export function ExerciceCodeRunner({
  exerciceId,
  slug,
  codeInitial,
}: {
  exerciceId: string;
  slug: string;
  codeInitial: string;
}) {
  return (
    <PythonRunner
      codeInitial={codeInitial}
      soumissionLabel="Soumettre"
      onSoumettre={(code, sortie, capture) => soumettreExerciceCodeAction(exerciceId, slug, code, sortie, capture)}
    />
  );
}
