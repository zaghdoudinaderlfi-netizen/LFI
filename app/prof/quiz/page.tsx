import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, BarChart3, Gamepad2, PlusCircle } from "lucide-react";
import type { Matiere } from "@prisma/client";
import { listerQuizProf } from "@/lib/quiz";
import { matieresPresentes, regrouperParChapitre, MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";
import { estMatiereValide } from "@/lib/classes-constants";
import { MatiereTabs } from "@/components/matiere-tabs";
import { VisibiliteQuizToggle } from "./visibilite-toggle";

export default async function ProfQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ matiere?: string }>;
}) {
  const { matiere: matiereParam } = await searchParams;
  const tousLesQuiz = await listerQuizProf();
  const matieres = matieresPresentes(tousLesQuiz);
  const afficherOnglets = matieres.length > 1;

  const matiereActive: Matiere | null = afficherOnglets
    ? (estMatiereValide(matiereParam) && matieres.includes(matiereParam) ? matiereParam : matieres[0])
    : matieres[0] ?? null;

  const quiz = matiereActive ? tousLesQuiz.filter((q) => q.matiere === matiereActive) : tousLesQuiz;
  const parChapitre = regrouperParChapitre(quiz);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 animate-fade-in-up sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title mb-1">Quiz</h1>
          <p className="text-ink-secondary">
            Crée des quiz ludiques façon Kahoot, en mode solo — chaque élève joue quand il veut.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/prof" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Espace prof
          </Link>
          <Link href="/prof/quiz/nouveau" className="btn-primary">
            <PlusCircle className="h-4 w-4" />
            Nouveau quiz
          </Link>
        </div>
      </div>

      {afficherOnglets && (
        <Suspense fallback={null}>
          <MatiereTabs
            matiereActive={matiereActive}
            basePath="/prof/quiz"
            storageKey="prof-quiz-matiere-filtre"
          />
        </Suspense>
      )}

      <div className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        {quiz.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucun quiz pour le moment. Crée le premier quiz ci-dessus.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {[...parChapitre.entries()].map(([ch, quizDuChapitre]) => (
              <section key={ch ?? "sans-chapitre"}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-muted border-b border-space-border pb-2">
                  {ch !== null ? `Chapitre ${ch}` : "Sans chapitre"}
                </h2>
                <ul className="flex flex-col gap-3">
                  {quizDuChapitre.map((q) => (
                    <li
                      key={q.id}
                      className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="eyebrow mb-1 flex items-center gap-1.5">
                          <Gamepad2 className="h-3.5 w-3.5 text-neon-violet" />
                          {MATIERE_LABELS[q.matiere]}
                        </p>
                        <p className="font-medium text-ink-primary">{q.titre}</p>
                        <p className="text-sm text-ink-secondary">
                          {NIVEAU_LABELS[q.niveau]} · {q._count.questions} question
                          {q._count.questions > 1 ? "s" : ""} · {q._count.tentatives} partie
                          {q._count.tentatives > 1 ? "s" : ""} jouée{q._count.tentatives > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <VisibiliteQuizToggle quizId={q.id} visibleEleves={q.visibleEleves} />
                        <Link href={`/prof/quiz/${q.id}/resultats`} className="btn-secondary">
                          <BarChart3 className="h-4 w-4" />
                          Résultats
                        </Link>
                        <Link href={`/prof/quiz/${q.id}`} className="btn-secondary">
                          Modifier
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
