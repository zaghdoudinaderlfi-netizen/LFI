import Link from "next/link";
import { notFound } from "next/navigation";
import { TypeExercice } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CoursContenu } from "@/components/cours-contenu";
import { BlocsAffichage } from "@/components/blocs/blocs-affichage";
import { PiecesJointesListe } from "@/components/pieces-jointes-liste";
import { ApercuFichier } from "@/components/apercu-fichier";
import { obtenirCoursPublieParSlug, MATIERE_LABELS } from "@/lib/cours";
import { listerBlocsCours } from "@/lib/blocs";
import { listerPiecesJointes } from "@/lib/pieces-jointes";
import { listerDevoirsCours, obtenirChampsFormulaireDevoir } from "@/lib/devoirs";
import { listerExercicesCodeCours } from "@/lib/exercices-code";
import { obtenirSoumissionEleve } from "@/lib/soumissions";
import { CODE_PYTHON_DEFAUT } from "@/lib/python";
import { NIVEAU_LABELS } from "@/lib/classes";
import { DevoirSoumissionForm } from "./devoir-soumission-form";
import { FormulaireForm } from "./formulaire-form";
import { ExerciceCodeRunner } from "./exercice-code-form";

export default async function CoursLecturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { classe: true },
      })
    : null;

  if (!user?.classe) {
    notFound();
  }

  const cours = await obtenirCoursPublieParSlug(slug, user.classe.niveau);

  if (!cours) {
    notFound();
  }

  const piecesJointes = await listerPiecesJointes(cours.id);
  const blocs = await listerBlocsCours(cours.id);

  const devoirs = await listerDevoirsCours(cours.id);
  const devoirsAvecSoumission = await Promise.all(
    devoirs.map(async (devoir) => {
      const soumission = await obtenirSoumissionEleve(devoir.id, user.id);

      let champs: Awaited<ReturnType<typeof obtenirChampsFormulaireDevoir>> = [];
      if (devoir.type === TypeExercice.DEVOIR_PDF_FORMULAIRE) {
        try {
          champs = await obtenirChampsFormulaireDevoir(devoir);
        } catch {
          champs = [];
        }
      }

      let reponses: Record<string, string | boolean> = {};
      if (soumission?.contenu) {
        try {
          reponses = JSON.parse(soumission.contenu);
        } catch {
          reponses = {};
        }
      }

      return { devoir, soumission, champs, reponses };
    })
  );

  const exercicesCode = await listerExercicesCodeCours(cours.id);
  const exercicesCodeAvecSoumission = await Promise.all(
    exercicesCode.map(async (exercice) => {
      const soumission = await obtenirSoumissionEleve(exercice.id, user.id);

      let donnees: { code?: string; sortie?: string; reussiAuto?: boolean } = {};
      if (soumission?.contenu) {
        try {
          donnees = JSON.parse(soumission.contenu);
        } catch {
          donnees = {};
        }
      }

      return { exercice, soumission, donnees };
    })
  );

  return (
    <div>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Link href="/eleve/cours" className="text-sm text-slate-500 hover:underline">
          ← Retour aux cours
        </Link>

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

        {devoirsAvecSoumission.length > 0 && (
          <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Devoirs à rendre</h2>

            <ul className="flex flex-col gap-4">
              {devoirsAvecSoumission.map(({ devoir, soumission, champs, reponses }) => {
                const estFormulaire = devoir.type === TypeExercice.DEVOIR_PDF_FORMULAIRE;

                return (
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
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                          {estFormulaire ? "Aperçu du PDF-formulaire" : "Sujet"}
                        </p>
                        <ApercuFichier
                          nom={devoir.sujetNom}
                          taille={devoir.sujetTaille}
                          typeMime={devoir.sujetTypeMime}
                          urlBase={`/api/devoirs/${devoir.id}/sujet`}
                        />
                      </div>
                    )}

                    {soumission?.fichierNom && soumission.fichierTaille != null && soumission.fichierTypeMime && (
                      <div className="rounded-md bg-green-50 p-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-green-700">
                          {estFormulaire ? "Ton formulaire envoyé" : "Ton rendu"}
                        </p>
                        <ApercuFichier
                          nom={soumission.fichierNom}
                          taille={soumission.fichierTaille}
                          typeMime={soumission.fichierTypeMime}
                          urlBase={`/api/rendus/${soumission.id}`}
                        />
                      </div>
                    )}

                    {estFormulaire ? (
                      champs.length > 0 ? (
                        <FormulaireForm
                          exerciceId={devoir.id}
                          slug={cours.slug}
                          champs={champs}
                          reponses={reponses}
                        />
                      ) : (
                        <p className="text-sm text-slate-500">
                          Le formulaire n&apos;est pas encore disponible pour ce devoir.
                        </p>
                      )
                    ) : (
                      <>
                        {!soumission?.fichierNom && (
                          <p className="text-sm text-slate-500">Pas encore déposé.</p>
                        )}
                        <DevoirSoumissionForm exerciceId={devoir.id} slug={cours.slug} />
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {exercicesCodeAvecSoumission.length > 0 && (
          <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Exercices de code (Python / Turtle)</h2>

            <ul className="flex flex-col gap-6">
              {exercicesCodeAvecSoumission.map(({ exercice, soumission, donnees }) => (
                <li key={exercice.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-800">{exercice.titre}</p>
                    <p className="whitespace-pre-wrap text-sm text-slate-600">{exercice.consigne}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Barème : {exercice.points} pts
                      {exercice.dateLimite &&
                        ` · à rendre avant le ${exercice.dateLimite.toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>

                  <ExerciceCodeRunner
                    exerciceId={exercice.id}
                    slug={cours.slug}
                    codeInitial={donnees.code || exercice.codeDepart || CODE_PYTHON_DEFAUT}
                  />

                  {soumission && (
                    <div className="flex flex-col gap-1 text-sm">
                      {exercice.type === "PYTHON" && donnees.reussiAuto !== undefined && (
                        <p className={donnees.reussiAuto ? "text-green-600" : "text-amber-600"}>
                          Dernière soumission :{" "}
                          {donnees.reussiAuto ? "réussie ✅ (sortie conforme)" : "sortie non conforme à l'attendu"}
                        </p>
                      )}
                      {soumission.corrigeManuellement ? (
                        <p className="font-medium text-slate-700">
                          Note : {soumission.note} / {exercice.points}
                          {soumission.feedback && (
                            <span className="block font-normal text-slate-600">
                              Commentaire : {soumission.feedback}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-slate-500">En attente de correction par ton professeur.</p>
                      )}
                    </div>
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
