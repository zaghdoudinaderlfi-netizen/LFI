import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenirDevoir, TYPE_DEVOIR_LABELS } from "@/lib/devoirs";
import { obtenirCoursParId } from "@/lib/cours";
import { listerClasses, NIVEAU_LABELS } from "@/lib/classes";
import { listerRosterDevoir } from "@/lib/soumissions";
import { ApercuFichier } from "@/components/apercu-fichier";
import { CorrectionForm } from "../correction-form";

export default async function DevoirRosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ classe?: string }>;
}) {
  const { id } = await params;
  const { classe: classeIdParam } = await searchParams;

  const devoir = await obtenirDevoir(id);
  if (!devoir) {
    notFound();
  }

  const cours = await obtenirCoursParId(devoir.coursId);
  if (!cours) {
    notFound();
  }

  const classes = await listerClasses();
  const classesNiveau = classes.filter((c) => c.niveau === cours.niveau);

  const classeId =
    classeIdParam && classesNiveau.some((c) => c.id === classeIdParam)
      ? classeIdParam
      : classesNiveau[0]?.id;

  const lignes = classeId ? await listerRosterDevoir(id, classeId) : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href={`/prof/cours/${cours.id}`} className="text-sm text-slate-500 hover:underline">
          ← Retour au cours
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-800">{devoir.titre}</h1>
        <p className="text-sm text-slate-500">
          {cours.titre} · {TYPE_DEVOIR_LABELS[devoir.type as keyof typeof TYPE_DEVOIR_LABELS]} · Barème :{" "}
          {devoir.points} pts
        </p>
      </div>

      {classesNiveau.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Aucune classe de {NIVEAU_LABELS[cours.niveau]} n&apos;est encore créée.
        </p>
      ) : (
        <>
          {classesNiveau.length > 1 && (
            <form className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <label htmlFor="classe" className="text-sm font-medium text-slate-700">
                Classe :
              </label>
              <select
                id="classe"
                name="classe"
                defaultValue={classeId}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {classesNiveau.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Afficher
              </button>
            </form>
          )}

          <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">
              {classesNiveau.find((c) => c.id === classeId)?.nom}
            </h2>

            {lignes.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun élève dans cette classe.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {lignes.map((ligne) => {
                  if (ligne.statut === "attente") {
                    return (
                      <li
                        key={ligne.eleve.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3"
                      >
                        <p className="font-medium text-slate-700">{ligne.eleve.nom}</p>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                          En attente
                        </span>
                      </li>
                    );
                  }

                  const { soumission, eleves } = ligne;
                  const nomsGroupe = eleves.map((e) => e.nom).join(", ");

                  return (
                    <li
                      key={soumission.id}
                      className="flex flex-col gap-3 rounded-md border border-slate-200 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-700">
                          {nomsGroupe}
                          {eleves.length > 1 && (
                            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                              Groupe de {eleves.length}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          {soumission.corrigeManuellement ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              Corrigé : {soumission.note} / {devoir.points}
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                              Rendu le {soumission.createdAt.toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </div>

                      {soumission.fichierNom && soumission.fichierTaille != null && soumission.fichierTypeMime && (
                        <div className="rounded-md bg-slate-50 p-3">
                          <ApercuFichier
                            nom={soumission.fichierNom}
                            taille={soumission.fichierTaille}
                            typeMime={soumission.fichierTypeMime}
                            urlBase={`/api/rendus/${soumission.id}`}
                          />
                        </div>
                      )}

                      {soumission.corrigeManuellement && soumission.feedback && (
                        <p className="text-sm text-slate-600">Commentaire : {soumission.feedback}</p>
                      )}

                      <CorrectionForm soumissionId={soumission.id} bareme={devoir.points} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
