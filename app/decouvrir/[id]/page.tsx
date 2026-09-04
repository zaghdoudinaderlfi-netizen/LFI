import Link from "next/link";
import { redirect } from "next/navigation";
import { MonitorPlay } from "lucide-react";
import { CoursContenu } from "@/components/cours-contenu";
import { BlocsAffichage } from "@/components/blocs/blocs-affichage";
import { PiecesJointesListe } from "@/components/pieces-jointes-liste";
import { obtenirCoursPublicParId, MATIERE_LABELS, urlImageCouverture } from "@/lib/cours";
import { listerBlocsCours } from "@/lib/blocs";
import { listerPiecesJointes } from "@/lib/pieces-jointes";
import { NIVEAU_LABELS } from "@/lib/classes";

export default async function CoursDecouvertePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cours = await obtenirCoursPublicParId(id);

  // Cours introuvable, ou pas (plus) public : on renvoie vers la connexion
  // normale plutôt que d'afficher une 404, au cas où le lien vitrine soit
  // resté partagé après retrait de la mise en avant.
  if (!cours) {
    redirect("/connexion");
  }

  const piecesJointes = await listerPiecesJointes(cours.id);
  const blocs = await listerBlocsCours(cours.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="link-muted text-sm font-medium">
          ← Retour à l&apos;accueil
        </Link>
        <Link href="/connexion" className="btn-secondary">
          Se connecter
        </Link>
      </div>

      <article className="card overflow-hidden">
        {!cours.pageInteractive && urlImageCouverture(cours.imageCouvertureChemin) && (
          <div className="relative h-48 w-full overflow-hidden sm:h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlImageCouverture(cours.imageCouvertureChemin)!}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="border-b border-space-border bg-gradient-to-br from-neon-blue/10 to-neon-violet/10 px-6 pb-5 pt-6 sm:px-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="badge bg-space-surface2/80 px-3 text-neon-cyan ring-1 ring-neon-cyan/30">
              {MATIERE_LABELS[cours.matiere]}
            </span>
            <span className="badge bg-space-surface2/80 px-3 text-ink-secondary ring-1 ring-space-border">
              {NIVEAU_LABELS[cours.niveau]}
            </span>
            <span className="badge bg-emerald-500/10 px-3 text-emerald-300 ring-1 ring-emerald-500/30">
              Cours découverte — accès libre
            </span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink-primary sm:text-4xl">
            {cours.titre}
          </h1>
        </div>

        <div className="p-6 sm:p-10">
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
                  Cours interactif
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neon-blue/70">
                    {MATIERE_LABELS[cours.matiere]}
                  </p>
                  <p className="text-lg font-semibold leading-snug text-ink-primary">
                    {cours.titreInteractif ?? cours.titre}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-neon-blue/10 px-4 py-2 text-sm font-medium text-neon-blue ring-1 ring-neon-blue/30 transition-colors group-hover:bg-neon-blue/20">
                  Ouvrir →
                </span>
              </div>
            </a>
          ) : (
            <CoursContenu cours={cours} />
          )}

          {blocs.length > 0 && (
            <div className="mt-8">
              <BlocsAffichage blocs={blocs} />
            </div>
          )}
        </div>
      </article>

      <div className="card flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-ink-secondary">
          Envie d&apos;accéder à tous les cours, exercices et quiz de la plateforme ?
        </p>
        <Link href="/connexion" className="btn-primary">
          Se connecter
        </Link>
      </div>
    </div>
  );
}
