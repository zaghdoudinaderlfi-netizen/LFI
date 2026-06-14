import Link from "next/link";
import { notFound } from "next/navigation";
import { TypeExercice } from "@prisma/client";
import { ApercuFichier } from "@/components/apercu-fichier";
import { obtenirCoursParId, MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";
import { listerPiecesJointes, formaterTaille } from "@/lib/pieces-jointes";
import { listerDevoirsCours, obtenirChampsFormulaireDevoir, TYPE_DEVOIR_LABELS } from "@/lib/devoirs";
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
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/prof/cours" className="text-sm text-slate-500 hover:underline">
              ← Retour aux cours
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">
              Modifier le cours
            </h1>
            <p className="text-sm text-slate-500">
              {NIVEAU_LABELS[cours.niveau]} · {MATIERE_LABELS[cours.matiere]}
            </p>
          </div>
          <Link
            href={`/prof/cours/${cours.id}/apercu`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            Aperçu
          </Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <CoursForm action={modifierCoursAction} cours={cours} submitLabel="Enregistrer" />
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Contenu du cours</h2>

          {cours.typeContenu === "PDF" && cours.pdfNom ? (
            <p className="text-sm text-slate-600">
              📄 PDF importé : <span className="font-medium">{cours.pdfNom}</span>
              {cours.pdfTaille != null && ` (${formaterTaille(cours.pdfTaille)})`}
            </p>
          ) : cours.contenu.trim() ? (
            <p className="text-sm text-slate-600">
              📝 Contenu texte (importé depuis un fichier Word).
            </p>
          ) : (
            <p className="text-sm text-slate-500">Aucun contenu importé pour le moment.</p>
          )}

          <ContenuForm coursId={cours.id} />
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Contenu en blocs</h2>
            <p className="text-sm text-slate-500">
              Compose le cours en empilant des blocs (texte, image, PDF, vidéo, activité, lien),
              affichés dans l&apos;ordre ci-dessous pour les élèves.
            </p>
          </div>

          <BlocListeProf coursId={cours.id} blocs={blocs} />
          <BlocsForm coursId={cours.id} />
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Pièces jointes</h2>

          {piecesJointes.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {piecesJointes.map((piece) => (
                <li
                  key={piece.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">{piece.nom}</p>
                    <p className="text-xs text-slate-400">{formaterTaille(piece.taille)}</p>
                  </div>
                  <form action={supprimerPieceJointeAction}>
                    <input type="hidden" name="id" value={piece.id} />
                    <input type="hidden" name="coursId" value={cours.id} />
                    <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                      Supprimer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Aucune pièce jointe pour ce cours.</p>
          )}

          <PieceJointeForm coursId={cours.id} />
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-800">Devoirs (dépôt élève)</h2>
            {cours.publie ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Cours publié — visible par les élèves de {NIVEAU_LABELS[cours.niveau]}
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Cours en brouillon — devoirs invisibles pour les élèves
              </span>
            )}
          </div>

          {devoirsAvecChamps.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {devoirsAvecChamps.map((devoir) => (
                <li
                  key={devoir.id}
                  className="flex flex-col gap-3 rounded-md border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-700">{devoir.titre}</p>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          {TYPE_DEVOIR_LABELS[devoir.type as keyof typeof TYPE_DEVOIR_LABELS]}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-400">
                        {devoir.points} pts
                        {devoir.dateLimite &&
                          ` · à rendre avant le ${devoir.dateLimite.toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Link
                        href={`/prof/devoirs/${devoir.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Voir les rendus
                      </Link>
                      <form action={supprimerDevoirAction}>
                        <input type="hidden" name="id" value={devoir.id} />
                        <input type="hidden" name="coursId" value={cours.id} />
                        <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>

                  {devoir.type === TypeExercice.DEVOIR_PDF_FORMULAIRE && (
                    <p className="text-xs text-slate-500">
                      {devoir.champs === null
                        ? !devoir.sujetNom
                          ? "Aucun PDF-formulaire déposé pour le moment."
                          : "Impossible de lire les champs de ce PDF."
                        : devoir.champs.length === 0
                          ? "⚠️ Ce PDF ne contient pas de champs remplissables (zones de texte ou cases à cocher)."
                          : `${devoir.champs.length} champ${devoir.champs.length > 1 ? "s" : ""} détecté${devoir.champs.length > 1 ? "s" : ""} dans le formulaire.`}
                    </p>
                  )}

                  {devoir.sujetNom && devoir.sujetTaille != null && devoir.sujetTypeMime && (
                    <div className="flex flex-col gap-2 rounded-md bg-slate-50 p-3">
                      <ApercuFichier
                        nom={devoir.sujetNom}
                        taille={devoir.sujetTaille}
                        typeMime={devoir.sujetTypeMime}
                        urlBase={`/api/devoirs/${devoir.id}/sujet`}
                      />
                      <form action={supprimerSujetDevoirAction} className="self-start">
                        <input type="hidden" name="devoirId" value={devoir.id} />
                        <input type="hidden" name="coursId" value={cours.id} />
                        <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
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
            <p className="text-sm text-slate-500">Aucun devoir pour ce cours.</p>
          )}

          <DevoirForm coursId={cours.id} />
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Exercices de code (Python / Turtle)</h2>
            <p className="text-sm text-slate-500">
              L&apos;élève code, exécute (Python et turtle, via Skulpt) et soumet. Pour le type Python, la sortie
              est comparée à la sortie attendue (correction automatique) ; pour Turtle, tu corriges manuellement.
            </p>
          </div>

          {exercicesCode.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {exercicesCode.map((exercice) => (
                <li
                  key={exercice.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-700">{exercice.titre}</p>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {TYPE_EXERCICE_CODE_LABELS[exercice.type as keyof typeof TYPE_EXERCICE_CODE_LABELS]}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-400">
                      {exercice.points} pts
                      {exercice.dateLimite &&
                        ` · à rendre avant le ${exercice.dateLimite.toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                  <form action={supprimerExerciceCodeAction}>
                    <input type="hidden" name="id" value={exercice.id} />
                    <input type="hidden" name="coursId" value={cours.id} />
                    <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                      Supprimer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Aucun exercice de code pour ce cours.</p>
          )}

          <ExerciceCodeForm coursId={cours.id} />
        </div>
      </div>
    </div>
  );
}
