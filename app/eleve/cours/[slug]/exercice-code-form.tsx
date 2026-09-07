"use client";

import { useEffect, useRef, useState } from "react";
import { PythonRunner } from "@/components/python/python-runner";
import { soumettreExerciceCodeAction } from "./exercices-code-actions";

const INTERVALLE_STATUT_MS = 5_000;

export function ExerciceCodeRunner({
  exerciceId,
  slug,
  codeInitial,
  modeExamen = false,
  examenFin,
}: {
  exerciceId: string;
  slug: string;
  codeInitial: string;
  modeExamen?: boolean;
  /** ISO string — la fin du créneau d'examen, pour le chrono côté PythonRunner. */
  examenFin?: string | null;
}) {
  const [verrouille, setVerrouille] = useState(false);
  const verrouilleDejaSignaleRef = useRef(false);

  useEffect(() => {
    if (!modeExamen) return;

    function signalerSortie() {
      if (verrouilleDejaSignaleRef.current) return;
      verrouilleDejaSignaleRef.current = true;
      setVerrouille(true);
      fetch("/api/examen/verrouiller", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciceId }),
      }).catch(() => {
        // Le fetch keepalive a de bonnes chances d'aboutir même si l'onglet
        // se ferme juste après ; en cas d'échec réseau, le prof verra quand
        // même l'élève resté sur la page (pas de conséquence grave).
      });
    }

    function surChangementVisibilite() {
      if (document.hidden) signalerSortie();
    }

    document.addEventListener("visibilitychange", surChangementVisibilite);
    window.addEventListener("blur", signalerSortie);

    return () => {
      document.removeEventListener("visibilitychange", surChangementVisibilite);
      window.removeEventListener("blur", signalerSortie);
    };
  }, [modeExamen, exerciceId]);

  useEffect(() => {
    if (!verrouille) return;

    let annule = false;

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/examen/statut?exerciceId=${encodeURIComponent(exerciceId)}`, {
          cache: "no-store",
        });
        if (!res.ok || annule) return;
        const { verrouille: toujoursVerrouille } = await res.json();
        if (!toujoursVerrouille) {
          window.location.reload();
        }
      } catch {
        // Tick raté — sans conséquence, on réessaiera au prochain intervalle.
      }
    }, INTERVALLE_STATUT_MS);

    return () => {
      annule = true;
      clearInterval(id);
    };
  }, [verrouille, exerciceId]);

  if (verrouille) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-red-500/40 bg-red-500/5 p-6 text-center">
        <p className="text-2xl">🔒</p>
        <p className="font-bold text-red-400">Tu as quitté l&apos;écran pendant l&apos;épreuve.</p>
        <p className="text-sm text-ink-secondary">Ton professeur doit te débloquer pour continuer.</p>
      </div>
    );
  }

  return (
    <PythonRunner
      codeInitial={codeInitial}
      soumissionLabel="Soumettre"
      antiTriche={modeExamen}
      finChrono={examenFin ? new Date(examenFin) : undefined}
      onSoumettre={(code, sortie, capture) => soumettreExerciceCodeAction(exerciceId, slug, code, sortie, capture)}
    />
  );
}
