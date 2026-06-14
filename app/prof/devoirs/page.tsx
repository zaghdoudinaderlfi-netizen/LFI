import { TypeExercice } from "@prisma/client";
import { listerSoumissionsACorriger } from "@/lib/soumissions";
import { ApercuFichier } from "@/components/apercu-fichier";
import { SoumissionCodeAffichage } from "@/components/python/soumission-code-affichage";
import { formaterNomComplet } from "@/lib/utilisateurs";
import { CorrectionForm } from "./correction-form";

export default async function ProfDevoirsPage() {
  const soumissions = await listerSoumissionsACorriger();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-800">Devoirs &amp; corrections</h1>

      {soumissions.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-slate-500">Aucune copie à corriger pour le moment. 🎉</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {soumissions.map((soumission) => (
            <li
              key={soumission.id}
              className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-800">{soumission.exercice.titre}</p>
                  <p className="text-sm text-slate-500">
                    {soumission.exercice.cours.titre} · {formaterNomComplet(soumission.eleve)}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Rendu le {soumission.createdAt.toLocaleDateString("fr-FR")}
                </p>
              </div>

              {soumission.exercice.type === TypeExercice.PYTHON ||
              soumission.exercice.type === TypeExercice.TURTLE ? (
                <SoumissionCodeAffichage
                  contenu={soumission.contenu}
                  type={soumission.exercice.type}
                  sortieAttendue={soumission.exercice.sortieAttendue}
                />
              ) : (
                soumission.fichierNom &&
                soumission.fichierTaille != null &&
                soumission.fichierTypeMime && (
                  <div className="rounded-md bg-slate-50 p-3">
                    <ApercuFichier
                      nom={soumission.fichierNom}
                      taille={soumission.fichierTaille}
                      typeMime={soumission.fichierTypeMime}
                      urlBase={`/api/rendus/${soumission.id}`}
                    />
                  </div>
                )
              )}

              {soumission.exercice.type === TypeExercice.TURTLE &&
                soumission.fichierNom &&
                soumission.fichierTaille != null &&
                soumission.fichierTypeMime && (
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Capture du dessin
                    </p>
                    <ApercuFichier
                      nom={soumission.fichierNom}
                      taille={soumission.fichierTaille}
                      typeMime={soumission.fichierTypeMime}
                      urlBase={`/api/rendus/${soumission.id}`}
                    />
                  </div>
                )}

              <CorrectionForm soumissionId={soumission.id} bareme={soumission.exercice.points} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
