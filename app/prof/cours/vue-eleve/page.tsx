import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, BookOpen, Eye } from "lucide-react";
import type { Matiere } from "@prisma/client";
import { listerCoursPublies, matieresPresentes, regrouperParChapitre, MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS, NIVEAU_PAR_MATIERE } from "@/lib/classes-constants";
import { estMatiereValide } from "@/lib/classes-constants";
import { MatiereTabs } from "@/components/matiere-tabs";

// Un niveau ne correspond qu'à une seule matière (voir MATIERE_PAR_NIVEAU) —
// on réutilise donc l'onglet "matière" existant comme sélecteur de niveau :
// TECHNOLOGIE = 3ème, SNT = 2nde, NSI = 1ère.
export default async function VueEleveCoursPage({
  searchParams,
}: {
  searchParams: Promise<{ matiere?: string }>;
}) {
  const { matiere: matiereParam } = await searchParams;
  const matiere: Matiere = estMatiereValide(matiereParam) ? matiereParam : "TECHNOLOGIE";
  const niveau = NIVEAU_PAR_MATIERE[matiere];

  const cours = await listerCoursPublies(niveau);
  const matieres = matieresPresentes(cours);
  const parChapitre = regrouperParChapitre(cours);
  const afficherSectionsChapitre = [...parChapitre.keys()].some((ch) => ch !== null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Aperçu — vue élève
          </p>
          <h1 className="page-title">Mes cours</h1>
          <p className="text-sm text-ink-secondary">{NIVEAU_LABELS[niveau]}</p>
        </div>
        <Link href="/prof" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Tableau de bord
        </Link>
      </div>

      <Suspense fallback={null}>
        <MatiereTabs
          matiereActive={matiere}
          basePath="/prof/cours/vue-eleve"
          storageKey="prof-vue-eleve-matiere"
        />
      </Suspense>

      <div className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        {cours.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucun cours publié et visible pour {MATIERE_LABELS[matiere]} ({NIVEAU_LABELS[niveau]}) pour le moment.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {[...parChapitre.entries()].map(([chapitre, coursDuChapitre]) => (
              <div key={chapitre ?? "sans-chapitre"} className="flex flex-col gap-3">
                {afficherSectionsChapitre && (
                  <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                    {chapitre !== null ? `Chapitre ${chapitre}` : "Autres cours"}
                  </h2>
                )}
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {coursDuChapitre.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/prof/cours/vue-eleve/${c.slug}?matiere=${matiere}`}
                        className="item-arcade flex h-full items-start gap-3 p-4"
                      >
                        <BookOpen className="h-5 w-5 shrink-0 text-neon-cyan" />
                        <div>
                          <p className="font-medium text-ink-primary">{c.titreInteractif ?? c.titre}</p>
                          {matieres.length > 1 && (
                            <p className="text-xs text-ink-muted">{MATIERE_LABELS[c.matiere]}</p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
