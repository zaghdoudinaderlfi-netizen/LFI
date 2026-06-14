import Link from "next/link";
import { notFound } from "next/navigation";
import { CoursContenu } from "@/components/cours-contenu";
import { BlocsAffichage } from "@/components/blocs/blocs-affichage";
import { PiecesJointesListe } from "@/components/pieces-jointes-liste";
import { ApercuFichier } from "@/components/apercu-fichier";
import { obtenirCoursParId, MATIERE_LABELS } from "@/lib/cours";
import { listerBlocsCours } from "@/lib/blocs";
import { listerPiecesJointes } from "@/lib/pieces-jointes";
import { listerDevoirsCours } from "@/lib/devoirs";
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
  const devoirs = await listerDevoirsCours(id);

  return (
    <div>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link href={`/prof/cours/${cours.id}`} className="text-sm text-slate-500 hover:underline">
            ← Retour à l&apos;édition
          </Link>
          {!cours.publie && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              Brouillon — aperçu prof uniquement
            </span>
          )}
        </div>

        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            {MATIERE_LABELS[cours.matiere]} · {NIVEAU_LABELS[cours.niveau]}
          </p>
          <h1 className="mb-6 text-3xl font-bold text-slate-800">{cours.titre}</h1>
          <PiecesJointesListe pieces={piecesJointes} />
          <CoursContenu cours={cours} />
          {blocs.length > 0 && (
            <div className="mt-6">
              <BlocsAffichage blocs={blocs} />
            </div>
          )}
        </article>

        {devoirs.length > 0 && (
          <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Devoirs à rendre</h2>

            <ul className="flex flex-col gap-3">
              {devoirs.map((devoir) => (
                <li key={devoir.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-800">{devoir.titre}</p>
                    <p className="whitespace-pre-wrap text-sm text-slate-600">{devoir.consigne}</p>
                    <p className="mt-1 text-xs text-slate-400">
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
