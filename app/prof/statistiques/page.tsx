import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { statsQuestionsRateesGlobal } from "@/lib/quiz";
import { MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";

function tauxBadgeClasse(taux: number) {
  if (taux < 50) return "bg-red-500/10 text-red-400 ring-1 ring-red-500/30";
  if (taux < 75) return "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30";
  return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30";
}

function tauxBarreClasse(taux: number) {
  if (taux < 50) return "bg-red-400";
  if (taux < 75) return "bg-amber-400";
  return "bg-emerald-400";
}

export default async function StatistiquesPage() {
  const questionsRatees = await statsQuestionsRateesGlobal();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
      <div className="animate-fade-in-up">
        <h1 className="page-title">Statistiques</h1>
        <p className="text-sm text-ink-secondary">
          Aperçu pédagogique à partir des quiz joués par les élèves.
        </p>
      </div>

      <div className="card animate-fade-in-up flex flex-col gap-4 p-6">
        <h2 className="section-title flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-neon-cyan" />
          Questions les plus ratées (tous quiz confondus)
        </h2>

        {questionsRatees.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucune donnée pour le moment — les élèves n&apos;ont pas encore joué à un quiz.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {questionsRatees.map((q, i) => (
              <li
                key={q.id}
                className="flex flex-col gap-2 rounded-xl border border-space-border bg-space-surface2/60 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-primary">
                      <span className="text-ink-muted">{i + 1}.</span> {q.enonce}
                    </p>
                    <Link
                      href={`/prof/quiz/${q.quizId}/resultats`}
                      className="link-muted text-xs"
                    >
                      {q.quizTitre} · {NIVEAU_LABELS[q.niveau]} · {MATIERE_LABELS[q.matiere]}
                      {q.chapitre != null ? ` · Ch. ${q.chapitre}` : ""}
                    </Link>
                  </div>
                  <span className={`badge shrink-0 px-2.5 ${tauxBadgeClasse(q.tauxReussite)}`}>
                    {q.tauxReussite}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-space-border">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${tauxBarreClasse(q.tauxReussite)}`}
                    style={{ width: `${q.tauxReussite}%` }}
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
