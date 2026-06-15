import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { obtenirDevoir, TYPE_DEVOIR_LABELS } from "@/lib/devoirs";
import { obtenirCoursParId } from "@/lib/cours";
import { listerClasses, NIVEAU_LABELS } from "@/lib/classes";
import { listerRosterDevoir } from "@/lib/soumissions";
import { ApercuFichier } from "@/components/apercu-fichier";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { formaterNomComplet } from "@/lib/utilisateurs";
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
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
      <div className="animate-fade-in-up">
        <Link href={`/prof/cours/${cours.id}`} className="link-muted inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Retour au cours
        </Link>
        <h1 className="page-title mt-1">{devoir.titre}</h1>
        <p className="text-sm text-ink-secondary">
          {cours.titre} · {TYPE_DEVOIR_LABELS[devoir.type as keyof typeof TYPE_DEVOIR_LABELS]} · Barème :{" "}
          {devoir.points} pts
        </p>
      </div>

      {classesNiveau.length === 0 ? (
        <p className="card animate-fade-in-up p-6 text-sm text-ink-muted [animation-delay:60ms]">
          Aucune classe de {NIVEAU_LABELS[cours.niveau]} n&apos;est encore créée.
        </p>
      ) : (
        <>
          {classesNiveau.length > 1 && (
            <form className="card animate-fade-in-up flex items-center gap-2 p-4 [animation-delay:60ms]">
              <label htmlFor="classe" className="field-label">
                Classe :
              </label>
              <select id="classe" name="classe" defaultValue={classeId} className="input">
                {classesNiveau.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nom}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-secondary">
                Afficher
              </button>
            </form>
          )}

          <div className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:120ms]">
            <h2 className="section-title">
              {classesNiveau.find((c) => c.id === classeId)?.nom}
            </h2>

            {lignes.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucun élève dans cette classe.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {lignes.map((ligne) => {
                  if (ligne.statut === "attente") {
                    return (
                      <li
                        key={ligne.eleve.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-3"
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-primary">
                          <AvatarDisplay user={ligne.eleve} taille="sm" />
                          {formaterNomComplet(ligne.eleve)}
                        </span>
                        <span className="badge bg-amber-500/10 px-3 text-amber-400 ring-1 ring-amber-500/30">
                          En attente
                        </span>
                      </li>
                    );
                  }

                  const { soumission, eleves } = ligne;

                  return (
                    <li
                      key={soumission.id}
                      className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          {eleves.map((eleve) => (
                            <span key={eleve.id} className="inline-flex items-center gap-2 text-sm font-medium text-ink-primary">
                              <AvatarDisplay user={eleve} taille="sm" />
                              {formaterNomComplet(eleve)}
                            </span>
                          ))}
                          {eleves.length > 1 && (
                            <span className="badge bg-space-surface2 px-2 text-ink-secondary ring-1 ring-space-border">
                              Groupe de {eleves.length}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {soumission.corrigeManuellement ? (
                            <span className="badge bg-emerald-500/10 px-3 text-emerald-400 ring-1 ring-emerald-500/30">
                              Corrigé : {soumission.note} / {devoir.points}
                            </span>
                          ) : (
                            <span className="badge bg-neon-cyan/10 px-3 text-neon-cyan ring-1 ring-neon-cyan/30">
                              Rendu le {soumission.createdAt.toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </div>

                      {soumission.fichierNom && soumission.fichierTaille != null && soumission.fichierTypeMime && (
                        <div className="rounded-xl border border-space-border bg-space-surface/60 p-3">
                          <ApercuFichier
                            nom={soumission.fichierNom}
                            taille={soumission.fichierTaille}
                            typeMime={soumission.fichierTypeMime}
                            urlBase={`/api/rendus/${soumission.id}`}
                          />
                        </div>
                      )}

                      {soumission.corrigeManuellement && soumission.feedback && (
                        <p className="text-sm text-ink-secondary">Commentaire : {soumission.feedback}</p>
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
