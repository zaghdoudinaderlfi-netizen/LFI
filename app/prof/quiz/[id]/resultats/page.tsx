import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Trophy } from "lucide-react";
import { obtenirQuizParId, resultatsQuizParEleve, statsQuestionsQuiz } from "@/lib/quiz";
import { MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";

function tauxBadgeClasse(taux: number, nbReponses: number) {
  if (nbReponses === 0) return "bg-space-surface2 text-ink-muted ring-1 ring-space-border";
  if (taux < 50) return "bg-red-500/10 text-red-400 ring-1 ring-red-500/30";
  if (taux < 75) return "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30";
  return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30";
}

function tauxBarreClasse(taux: number) {
  if (taux < 50) return "bg-red-400";
  if (taux < 75) return "bg-amber-400";
  return "bg-emerald-400";
}

export default async function ResultatsQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await obtenirQuizParId(id);

  if (!quiz) {
    notFound();
  }

  const [resultatsEleves, statsQuestions] = await Promise.all([
    resultatsQuizParEleve(id),
    statsQuestionsQuiz(id),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
      <div className="animate-fade-in-up">
        <Link
          href={`/prof/quiz/${quiz.id}`}
          className="link-muted inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au quiz
        </Link>
        <h1 className="page-title mt-1">Résultats — {quiz.titre}</h1>
        <p className="text-sm text-ink-secondary">
          {NIVEAU_LABELS[quiz.niveau]} · {MATIERE_LABELS[quiz.matiere]}
        </p>
      </div>

      <div className="card animate-fade-in-up flex flex-col gap-4 p-6">
        <h2 className="section-title flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          Par élève ({resultatsEleves.length})
        </h2>

        {resultatsEleves.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun élève n&apos;a encore joué à ce quiz.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {resultatsEleves.map((r, i) => (
              <li
                key={r.eleveId}
                className="flex items-center justify-between gap-3 rounded-xl border border-space-border bg-space-surface2/60 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 shrink-0 text-center text-sm font-bold text-ink-muted">
                    {i + 1}
                  </span>
                  <p className="truncate font-medium text-ink-primary">{r.nom}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                  <span className="text-xs text-ink-secondary sm:text-sm">
                    {r.nbParties} partie{r.nbParties > 1 ? "s" : ""}
                  </span>
                  <span className="badge bg-neon-violet/10 px-3 font-bold text-neon-violet ring-1 ring-neon-violet/30">
                    {r.meilleurScore} pts
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:60ms]">
        <h2 className="section-title flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-neon-cyan" />
          Par question
        </h2>

        {statsQuestions.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucune question pour ce quiz.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {statsQuestions.map((q, i) => (
              <li
                key={q.id}
                className="flex flex-col gap-2 rounded-xl border border-space-border bg-space-surface2/60 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-ink-primary">
                    <span className="text-ink-muted">{i + 1}.</span> {q.enonce}
                  </p>
                  <span
                    className={`badge shrink-0 px-2.5 ${tauxBadgeClasse(q.tauxReussite, q.nbReponses)}`}
                  >
                    {q.nbReponses > 0 ? `${q.tauxReussite}%` : "—"}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-space-border">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${tauxBarreClasse(q.tauxReussite)}`}
                    style={{ width: `${q.nbReponses > 0 ? q.tauxReussite : 0}%` }}
                  />
                </div>
                <p className="text-xs text-ink-muted">
                  {q.nbCorrectes}/{q.nbReponses} bonne{q.nbReponses > 1 ? "s" : ""} réponse
                  {q.nbReponses > 1 ? "s" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
