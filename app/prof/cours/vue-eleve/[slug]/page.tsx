import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ClipboardList, Eye, MonitorPlay } from "lucide-react";
import { CoursContenu } from "@/components/cours-contenu";
import { BlocsAffichage } from "@/components/blocs/blocs-affichage";
import { PiecesJointesListe } from "@/components/pieces-jointes-liste";
import { ApercuFichier } from "@/components/apercu-fichier";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { obtenirCoursPublieParSlugPourProf, MATIERE_LABELS, urlImageCouverture } from "@/lib/cours";
import { listerBlocsCours } from "@/lib/blocs";
import { listerPiecesJointes } from "@/lib/pieces-jointes";
import { listerDevoirsCours } from "@/lib/devoirs";
import { NIVEAU_LABELS } from "@/lib/classes";

// Prévisualisation « comme les élèves la voient » — vue en lecture seule
// (pas de dépôt de devoir, pas d'exécution d'exercice) mais avec le corrigé
// toujours affiché pour le prof (CoursContenu estProf), afin de pouvoir le
// projeter en classe sans le rendre visible côté élève.
export default async function VueEleveCoursDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ matiere?: string }>;
}) {
  const { slug } = await params;
  const { matiere } = await searchParams;

  const cours = await obtenirCoursPublieParSlugPourProf(slug);
  if (!cours) {
    notFound();
  }

  const piecesJointes = await listerPiecesJointes(cours.id);
  const blocs = await listerBlocsCours(cours.id);
  const devoirs = await listerDevoirsCours(cours.id);

  const retourHref = matiere ? `/prof/cours/vue-eleve?matiere=${matiere}` : "/prof/cours/vue-eleve";

  return (
    <div>
      <ReadingProgress />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
        <div className="flex items-center justify-between gap-4 animate-fade-in-up">
          <Link href={retourHref} className="link-muted inline-flex w-fit items-center gap-1.5 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Retour à mes cours
          </Link>
          <span className="badge bg-neon-violet/10 px-3 text-neon-violet ring-1 ring-neon-violet/30">
            <Eye className="mr-1.5 inline h-3.5 w-3.5" />
            Aperçu — vue élève
          </span>
        </div>

        <article className="card animate-fade-in-up p-6 sm:p-10">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="badge bg-space-surface2 px-3 text-neon-cyan ring-1 ring-neon-cyan/30">
              {MATIERE_LABELS[cours.matiere]}
            </span>
            <span className="badge bg-space-surface2 px-3 text-ink-secondary ring-1 ring-space-border">
              {NIVEAU_LABELS[cours.niveau]}
            </span>
          </div>
          <h1 className="page-title mb-6">{cours.titreInteractif ?? cours.titre}</h1>
          <PiecesJointesListe pieces={piecesJointes} />

          {cours.pageInteractive ? (
            <a
              href={`/cours/${cours.pageInteractive}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group mb-6 flex flex-col overflow-hidden rounded-xl border border-space-border bg-space-surface2/60 transition-all hover:border-neon-blue/50 hover:shadow-lg hover:shadow-neon-blue/10"
            >
              <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-neon-blue/15 to-neon-violet/20">
                {(() => {
                  const imageUrl = urlImageCouverture(cours.imageCouvertureChemin);
                  return imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <MonitorPlay className="h-16 w-16 text-neon-blue/30" />
                    </div>
                  );
                })()}
                <span className="absolute bottom-3 left-3 badge bg-neon-blue/20 px-2.5 py-1 text-neon-blue ring-1 ring-neon-blue/40 backdrop-blur-sm">
                  <MonitorPlay className="mr-1.5 inline h-3.5 w-3.5" />
                  Cours interactif — corrigé toujours visible pour toi
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <p className="font-semibold text-ink-primary text-lg leading-snug">Ouvrir le cours interactif</p>
                <span className="shrink-0 rounded-lg bg-neon-blue/10 px-4 py-2 text-sm font-medium text-neon-blue ring-1 ring-neon-blue/30 group-hover:bg-neon-blue/20 transition-colors">
                  Ouvrir →
                </span>
              </div>
            </a>
          ) : (
            <CoursContenu cours={cours} estProf />
          )}

          {blocs.length > 0 && (
            <div className="mt-8">
              <BlocsAffichage blocs={blocs} />
            </div>
          )}
        </article>

        {devoirs.length > 0 && (
          <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:60ms]">
            <h2 className="section-title flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-neon-violet" />
              Devoirs à rendre (côté élève)
            </h2>

            <ul className="flex flex-col gap-4">
              {devoirs.map((devoir) => (
                <li key={devoir.id} className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4">
                  <div>
                    <p className="font-medium text-ink-primary">{devoir.titre}</p>
                    <p className="whitespace-pre-wrap text-sm text-ink-secondary">{devoir.consigne}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Barème : {devoir.points} pts
                      {devoir.dateLimite &&
                        ` · à rendre avant le ${devoir.dateLimite.toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>

                  {devoir.sujetNom && devoir.sujetTaille != null && devoir.sujetTypeMime && (
                    <ApercuFichier
                      nom={devoir.sujetNom}
                      taille={devoir.sujetTaille}
                      typeMime={devoir.sujetTypeMime}
                      urlBase={`/api/devoirs/${devoir.id}/sujet`}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
