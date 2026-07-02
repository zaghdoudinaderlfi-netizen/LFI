import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, BookOpen, MonitorPlay, PlusCircle } from "lucide-react";
import type { Matiere } from "@prisma/client";
import { listerCoursProf, matieresPresentes, regrouperParChapitre, MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";
import { estMatiereValide } from "@/lib/classes-constants";
import { MatiereTabs } from "@/components/matiere-tabs";
import { SupprimerCoursButton } from "./[id]/supprimer-cours-button";
import { VisibiliteToggle } from "./visibilite-toggle";

export default async function ProfCoursPage({
  searchParams,
}: {
  searchParams: Promise<{ matiere?: string }>;
}) {
  const { matiere: matiereParam } = await searchParams;
  const tousLesCours = await listerCoursProf();
  const matieres = matieresPresentes(tousLesCours);
  const afficherOnglets = matieres.length > 1;

  const matiereActive: Matiere | null = afficherOnglets
    ? (estMatiereValide(matiereParam) && matieres.includes(matiereParam) ? matiereParam : matieres[0])
    : matieres[0] ?? null;

  const cours = matiereActive ? tousLesCours.filter((c) => c.matiere === matiereActive) : tousLesCours;
  const parChapitre = regrouperParChapitre(cours);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 animate-fade-in-up sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title mb-1">Cours</h1>
          <p className="text-ink-secondary">
            Crée, édite et publie les cours par niveau et matière.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/prof" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Espace prof
          </Link>
          <Link href="/prof/cours/nouveau" className="btn-primary">
            <PlusCircle className="h-4 w-4" />
            Nouveau cours
          </Link>
        </div>
      </div>

      {afficherOnglets && (
        <Suspense fallback={null}>
          <MatiereTabs
            matiereActive={matiereActive}
            basePath="/prof/cours"
            storageKey="prof-cours-matiere-filtre"
          />
        </Suspense>
      )}

      <div className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        {cours.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucun cours pour le moment. Crée le premier cours ci-dessus.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {[...parChapitre.entries()].map(([ch, coursDuChapitre]) => (
              <section key={ch ?? "sans-chapitre"}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-muted border-b border-space-border pb-2">
                  {ch !== null ? `Chapitre ${ch}` : "Sans chapitre"}
                </h2>
                <ul className="flex flex-col gap-3">
                  {coursDuChapitre.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="eyebrow mb-1 flex items-center gap-1.5">
                          {c.pageInteractive ? (
                            <MonitorPlay className="h-3.5 w-3.5 text-neon-blue" />
                          ) : (
                            <BookOpen className="h-3.5 w-3.5" />
                          )}
                          {MATIERE_LABELS[c.matiere]}
                          {c.pageInteractive && (
                            <span className="badge bg-neon-blue/15 px-2 text-neon-blue ring-1 ring-neon-blue/30">
                              Interactif
                            </span>
                          )}
                        </p>
                        <p className="font-medium text-ink-primary">{c.titre}</p>
                        <p className="text-sm text-ink-secondary">{NIVEAU_LABELS[c.niveau]}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`badge px-3 ${
                            c.publie
                              ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                          }`}
                        >
                          {c.publie ? "Publié" : "Brouillon"}
                        </span>
                        <VisibiliteToggle coursId={c.id} visibleEleves={c.visibleEleves} />
                        <Link href={`/prof/cours/${c.id}`} className="btn-secondary">
                          Modifier
                        </Link>
                        <SupprimerCoursButton coursId={c.id} titreCours={c.titre} />
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
