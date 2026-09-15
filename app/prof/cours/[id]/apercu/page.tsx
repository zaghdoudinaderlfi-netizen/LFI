import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CoursContenu } from "@/components/cours-contenu";
import { BlocsAffichage } from "@/components/blocs/blocs-affichage";
import { PiecesJointesListe } from "@/components/pieces-jointes-liste";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { obtenirCoursParId, MATIERE_LABELS } from "@/lib/cours";
import { listerBlocsCours } from "@/lib/blocs";
import { listerPiecesJointes } from "@/lib/pieces-jointes";
import { NIVEAU_LABELS } from "@/lib/classes";

export default async function ApercuCoursPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cours = await obtenirCoursParId(id);

  if (!cours) {
    notFound();
  }

  const piecesJointes = await listerPiecesJointes(id);
  const blocs = await listerBlocsCours(id);

  return (
    <div>
      <ReadingProgress />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
        <div className="flex items-center justify-between gap-4 animate-fade-in-up">
          <Link href={`/prof/cours/${cours.id}`} className="link-muted inline-flex w-fit items-center gap-1.5 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;édition
          </Link>
          {!cours.publie && (
            <span className="badge bg-amber-500/10 px-3 text-amber-400 ring-1 ring-amber-500/30">
              Brouillon — aperçu prof uniquement
            </span>
          )}
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
          <h1 className="page-title mb-6">{cours.titre}</h1>
          <PiecesJointesListe pieces={piecesJointes} />
          <CoursContenu cours={cours} estProf />
          {blocs.length > 0 && (
            <div className="mt-8">
              <BlocsAffichage blocs={blocs} />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
