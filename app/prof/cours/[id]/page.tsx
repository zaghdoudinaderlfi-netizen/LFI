import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Code2, FileText, Layers, Paperclip } from "lucide-react";
import { TypeExercice } from "@prisma/client";
import { ApercuFichier } from "@/components/apercu-fichier";
import { SupprimerCoursButton } from "./supprimer-cours-button";
import { obtenirCoursParId, MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";
import { listerPiecesJointes, formaterTaille } from "@/lib/pieces-jointes";
import {
  listerDevoirsCours,
  obtenirChampsFormulaireDevoir,
  TYPE_DEVOIR_LABELS,
  ModeRemiseFormulaire,
} from "@/lib/devoirs";
import { listerExercicesCodeCours, TYPE_EXERCICE_CODE_LABELS } from "@/lib/exercices-code";
import { listerBlocsCours } from "@/lib/blocs";
import { BlocListeProf } from "@/components/blocs/bloc-liste-prof";
import { modifierCoursAction } from "../actions";
import { CoursForm } from "../cours-form";
import { ContenuForm } from "./contenu-form";
import { BlocsForm } from "./blocs-form";
import { PieceJointeForm } from "./pieces-jointes-form";
import { supprimerPieceJointeAction } from "./pieces-jointes-actions";
import { DevoirForm } from "./devoirs-form";
import { DevoirModeForm } from "./devoir-mode-form";
import { DevoirSujetForm } from "./devoir-sujet-form";
import { supprimerDevoirAction, supprimerSujetDevoirAction } from "./devoirs-actions";
import { ExerciceCodeForm } from "./exercices-code-form";
import { supprimerExerciceCodeAction } from "./exercices-code-actions";

export default async function ModifierCoursPage({
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
  const exercicesCode = await listerExercicesCodeCours(id);
  const devoirsAvecChamps = await Promise.all(
    devoirs.map(async (devoir) => {
      if (devoir.type !== TypeExercice.DEVOIR_PDF_FORMULAIRE) {
        return { ...devoir, champs: null };
      }
      try {
        const champs = await obtenirChampsFormulaireDevoir(devoir);
        return { ...devoir, champs };
      } catch {
        return { ...devoir, champs: null };
      }
    })
  );

  return (
    <div>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
        <div className="flex items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <Link href="/prof/cours" className="link-muted inline-flex items-center gap-1.5 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Retour aux cours
            </Link>
            <h1 className="page-title mt-1">Modifier le cours</h1>
            <p className="text-sm text-ink-secondary">
              {NIVEAU_LABELS[cours.niveau]} · {MATIERE_LABELS[cours.matiere]}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/prof/cours/${cours.id}/apercu`} className="btn-secondary">
              Aperçu
            </Link>
            <SupprimerCoursButton coursId={cours.id} titreCours={cours.titre} />
          </div>
        </div>

        <div className="card animate-fade-in-up p-6">
          <CoursForm action={modifierCoursAction} cours={cours} submitLabel="Enregistrer" />
        </div>

        <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:60ms]">
          <h2 className="section-title flex items-center gap-2">
            <FileText className="h-5 w-5 text-neon-cyan" />
            Contenu du cours
          </h2>

          {cours.typeContenu === "PDF" && cours.pdfNom ? (
            <p className="text-sm text-ink-secondary">
              📄 PDF importé : <span className="font-medium text-ink-primary">{cours.pdfNom}</span>
              {cours.pdfTaille != null && ` (${formaterTaille(cours.pdfTaille)})`}
            </p>
          ) : cours.contenu.trim() ? (
            <p className="text-sm text-ink-secondary">
              📝 Contenu texte (importé depuis un fichier Word).
            </p>
          ) : (
            <p className="text-sm text-ink-muted">Aucun contenu importé pour le moment.</p>
          )}

          <ContenuForm coursId={cours.id} />
        </div>

        <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:120ms]">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Layers className="h-5 w-5 text-neon-violet" />
              Contenu en blocs
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Compose le cours en empilant des blocs (texte, image, PDF, vidéo, activité, lien),
              affichés dans l&apos;ordre ci-dessous pour les élèves.
            </p>
          </div>

          <BlocListeProf coursId={cours.id} blocs={blocs} />
          <BlocsForm coursId={cours.id} />
        </div>

        <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:180ms]">
          <h2 className="section-title flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-neon-cyan" />
            Pièces jointes
          </h2>

          {piecesJointes.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {piecesJointes.map((piece) => (
                <li
                  key={piece.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-space-border bg-space-surface2/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-primary">{piece.nom}</p>
                    <p className="text-xs text-ink-muted">{formaterTaille(piece.taille)}</p>
                  </div>
                  <form action={supprimerPieceJointeAction}>
                    <input type="hidden" name="id" value={piece.id} />
                    <input type="hidden" name="coursId" value={cours.id} />
                    <button type="submit" className="text-sm font-medium text-red-400 hover:underline">
                      Supprimer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Aucune pièce jointe pour ce cours.</p>
          )}

          <PieceJointeForm coursId={cours.id} />
        </div>

        <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:240ms]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-neon-violet" />
              Devoirs (dépôt élève)
            </h2>
            {cours.publie ? (
              <span className="badge bg-emerald-500/10 px-3 text-emerald-400 ring-1 ring-emerald-500/30">
                Cours publié — visible par les élèves de {NIVEAU_LABELS[cours.niveau]}
              </span>
            ) : (
              <span className="badge bg-amber-500/10 px-3 text-amber-400 ring-1 ring-amber-500/30">
                Cours en brouillon — devoirs invisibles pour les élèves
              </span>
            )}
          </div>

          {devoirsAvecChamps.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {devoirsAvecChamps.map((devoir) => (
                <li
                  key={devoir.id}
                  className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink-primary">{devoir.titre}</p>
                        <span className="badge bg-space-surface2 px-2 text-ink-secondary ring-1 ring-space-border">
                          {TYPE_DEVOIR_LABELS[devoir.type as keyof typeof TYPE_DEVOIR_LABELS]}
                        </span>
                      </div>
                      <p className="truncate text-xs text-ink-muted">
                        {devoir.points} pts
                        {devoir.dateLimite &&
                          ` · à rendre avant le ${devoir.dateLimite.toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Link
                        href={`/prof/devoirs/${devoir.id}`}
                        className="text-sm font-medium text-neon-cyan hover:underline"
                      >
                        Voir les rendus
                      </Link>
                      <form action={supprimerDevoirAction}>
                        <input type="hidden" name="id" value={devoir.id} />
                        <input type="hidden" name="coursId" value={cours.id} />
                        <button type="submit" className="text-sm font-medium text-red-400 hover:underline">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>

                  {devoir.type === TypeExercice.DEVOIR_PDF_FORMULAIRE && (
                    <>
                      <p className="text-xs text-ink-muted">
                        {devoir.modeRemise === ModeRemiseFormulaire.TELECHARGEMENT
                          ? "Mode téléchargement : l'élève télécharge ce PDF, le remplit dans son lecteur, puis dépose le fichier rempli."
                          : devoir.champs === null
                            ? !devoir.sujetNom
                              ? "Aucun PDF-formulaire déposé pour le moment."
                              : "Impossible de lire les champs de ce PDF."
                            : devoir.champs.length === 0
                              ? "⚠️ Ce PDF ne contient pas de champs remplissables (zones de texte ou cases à cocher)."
                              : `${devoir.champs.length} champ${devoir.champs.length > 1 ? "s" : ""} détecté${devoir.champs.length > 1 ? "s" : ""} dans le formulaire.`}
                      </p>
                      <DevoirModeForm devoirId={devoir.id} coursId={cours.id} modeRemise={devoir.modeRemise} />
                    </>
                  )}

                  {devoir.sujetNom && devoir.sujetTaille != null && devoir.sujetTypeMime && (
                    <div className="flex flex-col gap-2 rounded-xl border border-space-border bg-space-surface/60 p-3">
                      <ApercuFichier
                        nom={devoir.sujetNom}
                        taille={devoir.sujetTaille}
                        typeMime={devoir.sujetTypeMime}
                        urlBase={`/api/devoirs/${devoir.id}/sujet`}
                      />
                      <form action={supprimerSujetDevoirAction} className="self-start">
                        <input type="hidden" name="devoirId" value={devoir.id} />
                        <input type="hidden" name="coursId" value={cours.id} />
                        <button type="submit" className="text-xs font-medium text-red-400 hover:underline">
                          Supprimer le sujet
                        </button>
                      </form>
                    </div>
                  )}

                  <DevoirSujetForm
                    devoirId={devoir.id}
                    coursId={cours.id}
                    type={devoir.type}
                    aDejaSujet={!!devoir.sujetNom}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Aucun devoir pour ce cours.</p>
          )}

          <DevoirForm coursId={cours.id} />
        </div>

        <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:300ms]">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Code2 className="h-5 w-5 text-neon-cyan" />
              Exercices de code (Python / Turtle)
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">
              L&apos;élève code, exécute (Python et turtle, via Skulpt) et soumet. Pour le type Python, la sortie
              est comparée à la sortie attendue (correction automatique) ; pour Turtle, tu corriges manuellement.
            </p>
          </div>

          {exercicesCode.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {exercicesCode.map((exercice) => (
                <li
                  key={exercice.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink-primary">{exercice.titre}</p>
                      <span className="badge bg-space-surface2 px-2 text-ink-secondary ring-1 ring-space-border">
                        {TYPE_EXERCICE_CODE_LABELS[exercice.type as keyof typeof TYPE_EXERCICE_CODE_LABELS]}
                      </span>
                    </div>
                    <p className="truncate text-xs text-ink-muted">
                      {exercice.points} pts
                      {exercice.dateLimite &&
                        ` · à rendre avant le ${exercice.dateLimite.toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                  <form action={supprimerExerciceCodeAction}>
                    <input type="hidden" name="id" value={exercice.id} />
                    <input type="hidden" name="coursId" value={cours.id} />
                    <button type="submit" className="text-sm font-medium text-red-400 hover:underline">
                      Supprimer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Aucun exercice de code pour ce cours.</p>
          )}

          <ExerciceCodeForm coursId={cours.id} />
        </div>
      </div>
    </div>
  );
}
