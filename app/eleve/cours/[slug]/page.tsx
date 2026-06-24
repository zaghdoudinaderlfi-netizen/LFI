import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ClipboardList, Code2, MonitorPlay } from "lucide-react";
import { TypeExercice } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CoursContenu } from "@/components/cours-contenu";
import { BlocsAffichage } from "@/components/blocs/blocs-affichage";
import { PiecesJointesListe } from "@/components/pieces-jointes-liste";
import { ApercuFichier } from "@/components/apercu-fichier";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { obtenirCoursPublieParSlug, MATIERE_LABELS, urlImageCouverture } from "@/lib/cours";
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
          className="btn-secondary w-fit animate-fade-in-up"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux cours
        </Link>

        <article className="card animate-fade-in-up overflow-hidden">
          {/* Bandeau header */}
          <div className="bg-gradient-to-br from-neon-blue/10 to-neon-violet/10 border-b border-space-border px-6 pt-6 pb-5 sm:px-10">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="badge bg-space-surface2/80 px-3 text-neon-cyan ring-1 ring-neon-cyan/30">
                {MATIERE_LABELS[cours.matiere]}
              </span>
              <span className="badge bg-space-surface2/80 px-3 text-ink-secondary ring-1 ring-space-border">
                {NIVEAU_LABELS[cours.niveau]}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-primary sm:text-4xl font-heading">
              {cours.titre}
            </h1>
          </div>

          {/* Contenu */}
          <div className="p-6 sm:p-10">
            <PiecesJointesListe pieces={piecesJointes} />

            {cours.pageInteractive ? (
              <a
                href={`/cours/${cours.pageInteractive}${cours.correctionVisible ? "?corrige=1" : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group mb-6 flex flex-col overflow-hidden rounded-xl border border-space-border bg-space-surface2/60 transition-all hover:border-neon-blue/50 hover:shadow-lg hover:shadow-neon-blue/10"
              >
                {/* Vignette */}
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

                {/* Corps */}
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neon-blue/70 mb-1">
                      {MATIERE_LABELS[cours.matiere]}
                    </p>
                    <p className="font-semibold text-ink-primary text-lg leading-snug">
                      {cours.titreInteractif ?? cours.titre}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-neon-blue/10 px-4 py-2 text-sm font-medium text-neon-blue ring-1 ring-neon-blue/30 group-hover:bg-neon-blue/20 transition-colors">
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
                  <li key={devoir.id} className="flex flex-col gap-3 rounded-xl border border-l-4 border-neon-violet border-space-border bg-space-surface2/40 p-4">
                    <div>
                      <p className="font-semibold text-base text-ink-primary">{devoir.titre}</p>
                      <p className="whitespace-pre-wrap text-sm text-ink-secondary mt-1">{devoir.consigne}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                        <span>Barème : {devoir.points} pts</span>
                        {devoir.dateLimite && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-400 ring-1 ring-amber-500/20">
                            <CalendarDays className="h-3 w-3" />
                            avant le {devoir.dateLimite.toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
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
                <li key={exercice.id} className="flex flex-col gap-3 rounded-xl border border-l-4 border-neon-cyan border-space-border bg-space-surface2/40 p-4">
                  <div>
                    <p className="font-semibold text-base text-ink-primary">{exercice.titre}</p>
                    <p className="whitespace-pre-wrap text-sm text-ink-secondary mt-1">{exercice.consigne}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      <span>Barème : {exercice.points} pts</span>
                      {exercice.dateLimite && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-400 ring-1 ring-amber-500/20">
                          <CalendarDays className="h-3 w-3" />
                          avant le {exercice.dateLimite.toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
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
