import Link from "next/link";
import { auth } from "@/auth";
import { Star } from "lucide-react";
import { listerNotesEleve } from "@/lib/soumissions";
import { obtenirSuiviEleve, obtenirProgressionEleve, TRIMESTRE_LABELS } from "@/lib/suivi-oral";
import { EtoilesAffichage } from "@/components/suivi/etoiles";
import { ProgressionBouclier } from "@/components/suivi/bouclier";

export default async function EleveNotesPage() {
  const session = await auth();

  const [notes, suivi, progression] = session?.user?.id
    ? await Promise.all([
        listerNotesEleve(session.user.id),
        obtenirSuiviEleve(session.user.id),
        obtenirProgressionEleve(session.user.id),
      ])
    : [[], [], null];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="page-title animate-fade-in-up">Mes notes</h1>

      {progression && (
        <section className="card-hard card-hard-violet animate-fade-in-up p-6">
          <ProgressionBouclier {...progression} />
        </section>
      )}

      {suivi.length > 0 && (
        <section className="card-hard card-hard-violet animate-fade-in-up p-6">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Star className="h-5 w-5" style={{ color: "rgb(var(--neon-violet))" }} />
            Vie de classe — note orale
          </h2>
          <ul className="flex flex-col gap-3">
            {suivi.map((t) => (
              <li key={t.trimestre} className="item-arcade flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-ink-primary">
                    {TRIMESTRE_LABELS[t.trimestre]}
                    {t.estActuel && <span className="ml-2 text-xs text-ink-muted">(en cours)</span>}
                  </p>
                  {t.moyenne0a5 !== null && <EtoilesAffichage valeur={t.moyenne0a5} taille="h-4 w-4" />}
                </div>
                <p className="font-heading text-lg font-bold text-ink-primary">
                  {t.note20 !== null ? `${t.note20.toFixed(1)} / 20` : "—"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {notes.length === 0 ? (
        <div className="card animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">Aucune note pour le moment.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 animate-fade-in-up [animation-delay:60ms]">
          {notes.map((soumission) => (
            <li key={soumission.id}>
              <Link
                href={`/eleve/cours/${soumission.exercice.cours.slug}`}
                className="card-interactive flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink-primary">{soumission.exercice.titre}</p>
                  <p className="text-sm text-ink-secondary">{soumission.exercice.cours.titre}</p>
                  {soumission.feedback && (
                    <p className="mt-1 text-sm text-ink-secondary">
                      Commentaire : {soumission.feedback}
                    </p>
                  )}
                </div>
                <p className="font-heading text-lg font-bold text-neon-cyan sm:text-right">
                  {soumission.note} / {soumission.exercice.points}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
