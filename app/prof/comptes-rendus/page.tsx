import Link from "next/link";
import { Paperclip } from "lucide-react";
import { Matiere } from "@prisma/client";
import {
  listerComptesRendus,
  listerClassesAvecComptesRendus,
  TriComptesRendus,
} from "@/lib/comptes-rendus";
import { MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";
import { estMatiereValide } from "@/lib/classes-constants";
import { formaterNomComplet } from "@/lib/utilisateurs";
import { NotationCompteRendu } from "@/components/suivi/notation-compte-rendu";
import { SupprimerCompteRenduButton } from "./[id]/supprimer-compte-rendu-button";

const MATIERES: Matiere[] = ["TECHNOLOGIE", "SNT", "NSI"];

export default async function ComptesRendusPage({
  searchParams,
}: {
  searchParams: Promise<{ tri?: string; matiere?: string; classe?: string }>;
}) {
  const { tri: triParam, matiere: matiereParam, classe: classeParam } = await searchParams;

  const tri: TriComptesRendus = triParam === "cours" ? "cours" : "date";
  const matiere = estMatiereValide(matiereParam) ? matiereParam : undefined;

  const classes = await listerClassesAvecComptesRendus();
  const classeId = classes.some((c) => c.id === classeParam) ? classeParam : undefined;

  const comptesRendus = await listerComptesRendus({ tri, matiere, classeId });

  function lien(remplacements: { tri?: string; matiere?: string; classe?: string }) {
    const params = new URLSearchParams();
    const valeurs = { tri, matiere, classe: classeId, ...remplacements };
    if (valeurs.tri && valeurs.tri !== "date") params.set("tri", valeurs.tri);
    if (valeurs.matiere) params.set("matiere", valeurs.matiere);
    if (valeurs.classe) params.set("classe", valeurs.classe);
    const query = params.toString();
    return query ? `/prof/comptes-rendus?${query}` : "/prof/comptes-rendus";
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="page-title animate-fade-in-up">Comptes-rendus</h1>

      <div className="card animate-fade-in-up flex flex-col gap-4 p-5 [animation-delay:40ms]">
        <div>
          <p className="eyebrow mb-2">Matière</p>
          <div className="flex flex-wrap gap-2">
            <Link href={lien({ matiere: undefined })} className={matiere ? "btn-secondary" : "btn-primary"}>
              Toutes
            </Link>
            {MATIERES.map((m) => (
              <Link
                key={m}
                href={lien({ matiere: m })}
                className={matiere === m ? "btn-primary" : "btn-secondary"}
              >
                {MATIERE_LABELS[m]}
              </Link>
            ))}
          </div>
        </div>

        {classes.length > 0 && (
          <div>
            <p className="eyebrow mb-2">Classe</p>
            <div className="flex flex-wrap gap-2">
              <Link href={lien({ classe: undefined })} className={classeId ? "btn-secondary" : "btn-primary"}>
                Toutes
              </Link>
              {classes.map((c) => (
                <Link
                  key={c.id}
                  href={lien({ classe: c.id })}
                  className={classeId === c.id ? "btn-primary" : "btn-secondary"}
                >
                  {c.nom}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="eyebrow mb-2">Trier par</p>
          <div className="flex flex-wrap gap-2">
            <Link href={lien({ tri: "date" })} className={tri === "date" ? "btn-primary" : "btn-secondary"}>
              Date
            </Link>
            <Link href={lien({ tri: "cours" })} className={tri === "cours" ? "btn-primary" : "btn-secondary"}>
              Cours
            </Link>
          </div>
        </div>
      </div>

      {comptesRendus.length === 0 ? (
        <div className="card animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">
            {matiere || classeId
              ? "Aucun compte-rendu ne correspond à ces filtres."
              : "Aucun compte-rendu déposé pour le moment."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 animate-fade-in-up [animation-delay:60ms]">
          {comptesRendus.map((cr) => (
            <li key={cr.id} className="card flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link
                  href={`/prof/comptes-rendus/${cr.id}`}
                  className="transition-colors hover:text-neon-blue"
                >
                  <p className="font-medium text-ink-primary">
                    {cr.cours.titre}
                    {cr.classe && (
                      <span className="ml-2 badge bg-space-surface2/80 px-2 text-ink-secondary ring-1 ring-space-border">
                        {cr.classe.nom}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-ink-secondary">
                    {MATIERE_LABELS[cr.cours.matiere]} · {NIVEAU_LABELS[cr.cours.niveau]}
                  </p>
                </Link>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-xs text-ink-muted">
                    Déposé le{" "}
                    {cr.dateDepot.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span className="text-xs text-neon-cyan">
                    {cr.travail ? "Voir le travail →" : "Sans travail joint"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-space-border pt-3">
                {cr.eleve ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-ink-primary">{formaterNomComplet(cr.eleve)}</span>
                    <NotationCompteRendu id={cr.id} valeurInitiale={cr.noteEtoiles} />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-ink-primary">{cr.noms}</span>
                    <NotationCompteRendu id={cr.id} valeurInitiale={cr.noteEtoiles} />
                  </div>
                )}
                {cr.membres.map((membre) => (
                  <div key={membre.eleveId} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-ink-primary">{formaterNomComplet(membre.eleve)}</span>
                    <NotationCompteRendu id={cr.id} eleveId={membre.eleveId} valeurInitiale={membre.etoiles} />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {cr.fichierUrl ? (
                  <a
                    href={cr.fichierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Voir le fichier joint
                  </a>
                ) : (
                  <span />
                )}
                <SupprimerCompteRenduButton
                  compteRenduId={cr.id}
                  libelle={`${cr.noms} — ${cr.cours.titre}`}
                  compact
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
