import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, ListChecks, Upload } from "lucide-react";
import { obtenirQuizParId } from "@/lib/quiz";
import { MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";
import { modifierQuizAction } from "../actions";
import { QuizForm } from "../quiz-form";
import { SupprimerQuizButton } from "./supprimer-quiz-button";
import { QuestionForm } from "./question-form";
import { ImportQuestionsForm } from "./import-questions-form";
import { supprimerQuestionAction } from "./questions-actions";

const LETTRES = ["A", "B", "C", "D"] as const;

export default async function ModifierQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await obtenirQuizParId(id);

  if (!quiz) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <Link href="/prof/quiz" className="link-muted inline-flex items-center gap-1.5 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Retour aux quiz
          </Link>
          <h1 className="page-title mt-1">Modifier le quiz</h1>
          <p className="text-sm text-ink-secondary">
            {NIVEAU_LABELS[quiz.niveau]} · {MATIERE_LABELS[quiz.matiere]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/prof/quiz/${quiz.id}/resultats`} className="btn-secondary">
            <BarChart3 className="h-4 w-4" />
            Résultats
          </Link>
          <SupprimerQuizButton quizId={quiz.id} titreQuiz={quiz.titre} />
        </div>
      </div>

      <div className="card animate-fade-in-up p-6">
        <QuizForm action={modifierQuizAction} quiz={quiz} submitLabel="Enregistrer" />
      </div>

      <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:60ms]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-neon-violet" />
            Questions ({quiz.questions.length})
          </h2>
          {quiz.visibleEleves ? (
            <span className="badge bg-emerald-500/10 px-3 text-emerald-400 ring-1 ring-emerald-500/30">
              Visible par les élèves
            </span>
          ) : (
            <span className="badge bg-amber-500/10 px-3 text-amber-400 ring-1 ring-amber-500/30">
              Masqué aux élèves
            </span>
          )}
        </div>

        {quiz.questions.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {quiz.questions.map((q, i) => (
              <li
                key={q.id}
                className="flex flex-col gap-2 rounded-xl border border-space-border bg-space-surface2/60 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-ink-primary">
                    <span className="text-ink-muted">{i + 1}.</span> {q.enonce}
                  </p>
                  <form action={supprimerQuestionAction} className="shrink-0">
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="quizId" value={quiz.id} />
                    <button type="submit" className="text-sm font-medium text-red-400 hover:underline">
                      Supprimer
                    </button>
                  </form>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {[q.choixA, q.choixB, q.choixC, q.choixD].map((choix, j) => (
                    <p
                      key={j}
                      className={`truncate rounded-lg border px-2.5 py-1 text-xs ${
                        j === q.bonneReponse
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-space-border text-ink-secondary"
                      }`}
                    >
                      {LETTRES[j]}. {choix}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-ink-muted">{q.tempsLimiteSec} s</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Aucune question pour ce quiz.</p>
        )}

        <QuestionForm quizId={quiz.id} />
      </div>

      <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:120ms]">
        <h2 className="section-title flex items-center gap-2">
          <Upload className="h-5 w-5 text-neon-cyan" />
          Import en masse
        </h2>
        <ImportQuestionsForm quizId={quiz.id} />
      </div>
    </div>
  );
}
