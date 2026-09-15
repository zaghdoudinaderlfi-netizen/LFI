"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCw, X } from "lucide-react";
import type { QuestionFlashcard } from "@/lib/quiz";

export function FlashcardsRevision({
  quizId,
  titre,
  questions,
}: {
  quizId: string;
  titre: string;
  questions: QuestionFlashcard[];
}) {
  const [index, setIndex] = useState(0);
  const [retournee, setRetournee] = useState(false);

  const question = questions[index];

  function aller(delta: number) {
    setRetournee(false);
    setIndex((i) => Math.min(Math.max(i + delta, 0), questions.length - 1));
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <p className="eyebrow">🃏 Révision libre</p>
          <h1 className="page-title">{titre}</h1>
        </div>
        <Link href={`/eleve/quiz/${quizId}`} className="btn-secondary">
          <X className="h-4 w-4" />
          Quitter
        </Link>
      </div>

      {questions.length === 0 || !question ? (
        <div className="card animate-fade-in-up p-6">
          <p className="text-sm text-ink-muted">Ce quiz n&apos;a pas encore de questions.</p>
        </div>
      ) : (
        <>
          <p className="text-center text-sm text-ink-secondary animate-fade-in-up">
            Carte {question.index} / {question.total}
          </p>

          <div className="animate-fade-in-up [animation-delay:60ms]" style={{ perspective: "1200px" }}>
            <button
              type="button"
              onClick={() => setRetournee((r) => !r)}
              aria-label="Retourner la carte"
              className="card relative h-72 w-full p-8 text-center transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: retournee ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="eyebrow">Question</span>
                <p className="text-lg font-semibold text-ink-primary">{question.enonce}</p>
                <span className="mt-2 text-xs text-ink-muted">Clique pour voir la réponse</span>
              </div>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <span className="eyebrow text-emerald-400">Réponse</span>
                <p className="text-lg font-semibold text-ink-primary">{question.bonneReponseTexte}</p>
              </div>
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 animate-fade-in-up [animation-delay:90ms]">
            <button
              type="button"
              onClick={() => aller(-1)}
              disabled={index === 0}
              className="btn-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Précédent
            </button>
            <button type="button" onClick={() => setRetournee((r) => !r)} className="btn-primary">
              <RotateCw className="h-4 w-4" />
              Retourner
            </button>
            <button
              type="button"
              onClick={() => aller(1)}
              disabled={index === questions.length - 1}
              className="btn-secondary"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
