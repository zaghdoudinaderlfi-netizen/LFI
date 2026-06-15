import { TypeExercice } from "@prisma/client";
import { listerSoumissionsACorriger } from "@/lib/soumissions";
import { ApercuFichier } from "@/components/apercu-fichier";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { SoumissionCodeAffichage } from "@/components/python/soumission-code-affichage";
import { formaterNomComplet } from "@/lib/utilisateurs";
import { CorrectionForm } from "./correction-form";

export default async function ProfDevoirsPage() {
  const soumissions = await listerSoumissionsACorriger();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="page-title animate-fade-in-up">Devoirs &amp; corrections</h1>

      {soumissions.length === 0 ? (
        <div className="card animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">Aucune copie à corriger pour le moment. 🎉</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4 animate-fade-in-up [animation-delay:60ms]">
          {soumissions.map((soumission) => (
            <li key={soumission.id} className="card flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink-primary">{soumission.exercice.titre}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-ink-secondary">
                    <AvatarDisplay user={soumission.eleve} taille="sm" />
                    {soumission.exercice.cours.titre} · {formaterNomComplet(soumission.eleve)}
                  </p>
                </div>
                <p className="text-xs text-ink-muted">
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
                  <div className="rounded-lg border border-space-border bg-space-surface2/60 p-3">
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
                  <div className="rounded-lg border border-space-border bg-space-surface2/60 p-3">
                    <p className="eyebrow mb-2">Capture du dessin</p>
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
