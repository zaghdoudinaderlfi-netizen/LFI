import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Gamepad2, Trophy } from "lucide-react";
import type { Matiere } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listerQuizVisiblesEleve, meilleursScoresEleve } from "@/lib/quiz";
import { matieresPresentes, regrouperParChapitre, MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";
import { estMatiereValide } from "@/lib/classes-constants";
import { MatiereTabs } from "@/components/matiere-tabs";

export default async function EleveQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ matiere?: string }>;
}) {
  const { matiere: matiereParam } = await searchParams;
  const session = await auth();

  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { classe: true },
      })
    : null;

  const tousLesQuiz = user?.classe ? await listerQuizVisiblesEleve(user.classe.niveau) : [];
  const meilleurs = user
    ? await meilleursScoresEleve(
        tousLesQuiz.map((q) => q.id),
        user.id
      )
    : new Map<string, number>();

  const matieres = matieresPresentes(tousLesQuiz);
  const afficherOnglets = matieres.length > 1;

  const matiereActive: Matiere | null = afficherOnglets
    ? (estMatiereValide(matiereParam) && matieres.includes(matiereParam) ? matiereParam : matieres[0])
    : matieres[0] ?? null;

  const quiz = matiereActive ? tousLesQuiz.filter((q) => q.matiere === matiereActive) : tousLesQuiz;
  const parChapitre = regrouperParChapitre(quiz);
  const afficherSectionsChapitre = [...parChapitre.keys()].some((ch) => ch !== null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <p className="eyebrow">
            {user?.classe ? NIVEAU_LABELS[user.classe.niveau] : "Aucune classe associée"}
          </p>
          <h1 className="page-title">Quiz</h1>
        </div>
        <Link href="/eleve" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Tableau de bord
        </Link>
      </div>

      {afficherOnglets && (
        <Suspense fallback={null}>
          <MatiereTabs
            matiereActive={matiereActive}
            basePath="/eleve/quiz"
            storageKey="eleve-quiz-matiere-filtre"
          />
        </Suspense>
      )}

      <div className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        {!user?.classe ? (
          <p className="text-sm text-ink-muted">
            Tu n&apos;es associé à aucune classe pour le moment.
          </p>
        ) : quiz.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun quiz disponible pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-8">
            {[...parChapitre.entries()].map(([ch, quizDuChapitre]) => (
              <section key={ch ?? "sans-chapitre"}>
                {afficherSectionsChapitre && (
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-muted border-b border-space-border pb-2">
                    {ch !== null ? `Chapitre ${ch}` : "Autres quiz"}
                  </h2>
                )}
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {quizDuChapitre.map((q) => {
                    const meilleurScore = meilleurs.get(q.id);
                    return (
                      <li key={q.id}>
                        <Link
                          href={`/eleve/quiz/${q.id}`}
                          className="card-interactive flex h-full flex-col gap-2 p-4"
                        >
                          <span className="eyebrow flex items-center gap-1.5">
                            <Gamepad2 className="h-3.5 w-3.5 text-neon-violet" />
                            {MATIERE_LABELS[q.matiere]}
                          </span>
                          <span className="font-medium text-ink-primary">{q.titre}</span>
                          <span className="text-xs text-ink-muted">
                            {q._count.questions} question{q._count.questions > 1 ? "s" : ""}
                          </span>
                          {meilleurScore !== undefined && (
                            <span className="mt-1 inline-flex w-fit items-center gap-1 badge bg-amber-500/15 px-2 text-amber-300 ring-1 ring-amber-500/30">
                              <Trophy className="h-3 w-3" />
                              Meilleur score : {meilleurScore}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
