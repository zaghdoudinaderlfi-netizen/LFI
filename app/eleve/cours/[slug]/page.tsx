import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Code2 } from "lucide-react";
import { TypeExercice } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CoursContenu } from "@/components/cours-contenu";
import { BlocsAffichage } from "@/components/blocs/blocs-affichage";
import { PiecesJointesListe } from "@/components/pieces-jointes-liste";
import { ApercuFichier } from "@/components/apercu-fichier";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { obtenirCoursPublieParSlug, MATIERE_LABELS } from "@/lib/cours";
import { listerBlocsCours } from "@/lib/blocs";
import { listerPiecesJointes } from "@/lib/pieces-jointes";
import { listerDevoirsCours, obtenirChampsFormulaireDevoir, ModeRemiseFormulaire } from "@/lib/devoirs";
import { listerExercicesCodeCours } from "@/lib/exercices-code";
import { obtenirSoumissionEleve, listerCamaradesClasse } from "@/lib/soumissions";
import { CODE_PYTHON_DEFAUT } from "@/lib/python";
import { NIVEAU_LABELS } from "@/lib/classes";
import { formaterNomComplet } from "@/lib/utilisateurs";
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

  const camarades = await listerCamaradesClasse(user.id);

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

      // Travail en groupe : l'élève est soit l'auteur du rendu (et peut le
      // modifier), soit un coéquipier désigné (rendu en lecture seule).
      const estAuteur = !soumission || soumission.eleve.id === user.id;
      const coequipiers = estAuteur ? soumission?.membres.map((m) => m.eleve.id) ?? [] : [];
      const membresGroupe = soumission
        ? [soumission.eleve, ...soumission.membres.map((m) => m.eleve)].filter((m) => m.id !== user.id)
        : [];

      return { devoir, soumission, champs, reponses, estAuteur, coequipiers, membresGroupe };
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
      <ReadingProgress />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
        <Link
          href="/eleve/cours"
          className="link-muted inline-flex w-fit items-center gap-1.5 text-sm animate-fade-in-up"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux cours
        </Link>

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
          <CoursContenu cours={cours} />
          {blocs.length > 0 && (
            <div className="mt-8">
              <BlocsAffichage blocs={blocs} />
            </div>
          )}
        </article>

        {devoirsAvecSoumission.length > 0 && (
          <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:60ms]">
            <h2 className="section-title flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-neon-violet" />
              Devoirs à rendre
            </h2>

            <ul className="flex flex-col gap-4">
              {devoirsAvecSoumission.map(({ devoir, soumission, champs, reponses, estAuteur, coequipiers, membresGroupe }) => {
                const estFormulaire = devoir.type === TypeExercice.DEVOIR_PDF_FORMULAIRE;
                const nomsGroupe = membresGroupe.map((m) => formaterNomComplet(m)).join(", ");
                // Mode B (« téléchargement ») : l'élève télécharge le PDF-formulaire,
                // le remplit dans son propre lecteur, puis dépose le fichier rempli
                // (même mécanisme que les devoirs "Envoi de fichier").
                const modeTelechargement = estFormulaire && devoir.modeRemise === ModeRemiseFormulaire.TELECHARGEMENT;
                // Pour un PDF-formulaire en mode "en ligne" avec des champs détectés,
                // le document est affiché en interactif (FormulaireForm) : pas
                // d'aperçu séparé du sujet, l'élève remplit directement le PDF affiché.
                const formulaireInteractif = estFormulaire && !modeTelechargement && champs.length > 0 && estAuteur;

                return (
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

                    {devoir.sujetNom && devoir.sujetTaille != null && devoir.sujetTypeMime && !formulaireInteractif && (
                      <div className="rounded-lg border border-space-border bg-space-surface/60 p-3">
                        <p className="eyebrow mb-2">
                          {modeTelechargement ? "Sujet à télécharger" : estFormulaire ? "Aperçu du PDF-formulaire" : "Sujet"}
                        </p>
                        {modeTelechargement && (
                          <p className="mb-2 text-xs text-ink-secondary">
                            Télécharge ce PDF, remplis-le dans ton lecteur PDF, puis dépose le fichier rempli ci-dessous.
                          </p>
                        )}
                        <ApercuFichier
                          nom={devoir.sujetNom}
                          taille={devoir.sujetTaille}
                          typeMime={devoir.sujetTypeMime}
                          urlBase={`/api/devoirs/${devoir.id}/sujet`}
                        />
                      </div>
                    )}

                    {soumission?.fichierNom && soumission.fichierTaille != null && soumission.fichierTypeMime && (
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                          {estFormulaire && !modeTelechargement ? "Ton formulaire envoyé" : "Ton rendu"}
                        </p>
                        <ApercuFichier
                          nom={soumission.fichierNom}
                          taille={soumission.fichierTaille}
                          typeMime={soumission.fichierTypeMime}
                          urlBase={`/api/rendus/${soumission.id}`}
                        />
                      </div>
                    )}

                    {!estAuteur && (
                      <p className="text-sm text-ink-secondary">
                        Rendu par votre groupe (avec {nomsGroupe}). Seul {formaterNomComplet(soumission!.eleve)} peut le modifier.
                      </p>
                    )}

                    {estFormulaire && !modeTelechargement ? (
                      champs.length > 0 ? (
                        formulaireInteractif && (
                          <FormulaireForm
                            exerciceId={devoir.id}
                            slug={cours.slug}
                            pdfUrl={`/api/devoirs/${devoir.id}/sujet?octets=1`}
                            champs={champs}
                            reponses={reponses}
                            camarades={camarades}
                            coequipiers={coequipiers}
                          />
                        )
                      ) : (
                        <p className="text-sm text-ink-muted">
                          Le formulaire n&apos;est pas encore disponible pour ce devoir.
                        </p>
                      )
                    ) : (
                      estAuteur && (
                        <>
                          {!soumission?.fichierNom && (
                            <p className="text-sm text-ink-muted">Pas encore déposé.</p>
                          )}
                          <DevoirSoumissionForm
                            exerciceId={devoir.id}
                            slug={cours.slug}
                            camarades={camarades}
                            coequipiers={coequipiers}
                          />
                        </>
                      )
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {exercicesCodeAvecSoumission.length > 0 && (
          <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:120ms]">
            <h2 className="section-title flex items-center gap-2">
              <Code2 className="h-5 w-5 text-neon-cyan" />
              Exercices de code (Python / Turtle)
            </h2>

            <ul className="flex flex-col gap-6">
              {exercicesCodeAvecSoumission.map(({ exercice, soumission, donnees }) => (
                <li key={exercice.id} className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4">
                  <div>
                    <p className="font-medium text-ink-primary">{exercice.titre}</p>
                    <p className="whitespace-pre-wrap text-sm text-ink-secondary">{exercice.consigne}</p>
                    <p className="mt-1 text-xs text-ink-muted">
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
                        <p className={donnees.reussiAuto ? "text-emerald-400" : "text-amber-400"}>
                          Dernière soumission :{" "}
                          {donnees.reussiAuto ? "réussie ✅ (sortie conforme)" : "sortie non conforme à l'attendu"}
                        </p>
                      )}
                      {soumission.corrigeManuellement ? (
                        <p className="font-medium text-ink-primary">
                          Note : {soumission.note} / {exercice.points}
                          {soumission.feedback && (
                            <span className="block font-normal text-ink-secondary">
                              Commentaire : {soumission.feedback}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-ink-muted">En attente de correction par ton professeur.</p>
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
