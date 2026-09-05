import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Trimestre } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  TRIMESTRE_LABELS,
  CRITERE_LABELS,
  trimestreActuel,
  obtenirSuiviEleve,
} from "@/lib/suivi-oral";
import { EtoilesAffichage } from "@/components/suivi/etoiles";
import { EntreeSuiviForm } from "./entree-suivi-form";
import { supprimerEntreeSuiviAction } from "../actions";

const TRIMESTRES: Trimestre[] = ["T1", "T2", "T3"];

function estTrimestreValide(valeur: string | undefined): valeur is Trimestre {
  return valeur === "T1" || valeur === "T2" || valeur === "T3";
}

export default async function SuiviEleveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; eleveId: string }>;
  searchParams: Promise<{ trimestre?: string }>;
}) {
  const { id: classeId, eleveId } = await params;
  const { trimestre: trimestreParam } = await searchParams;
  const trimestre = estTrimestreValide(trimestreParam) ? trimestreParam : trimestreActuel();

  const eleve = await prisma.user.findUnique({
    where: { id: eleveId, classeId, role: "ELEVE" },
    select: { id: true, nom: true, prenom: true },
  });
  if (!eleve) notFound();

  const suivi = await obtenirSuiviEleve(eleveId);
  const trimestreCourant = suivi.find((t) => t.trimestre === trimestre) ?? {
    trimestre,
    entrees: [],
    comptesRendus: [],
    travailFaitAvg: null,
    compteRenduAvg: null,
    assiduiteAvg: null,
    moyenne0a5: null,
    pointsTrimestre: 0,
    note20: null,
    estActuel: trimestre === trimestreActuel(),
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href={`/prof/classes/${classeId}/suivi?trimestre=${trimestre}`} className="btn-secondary w-fit animate-fade-in-up">
        <ArrowLeft className="h-4 w-4" />
        Retour à la classe
      </Link>

      <div className="animate-fade-in-up">
        <h1 className="page-title">
          {eleve.prenom ? `${eleve.prenom} ${eleve.nom}` : eleve.nom}
        </h1>
      </div>

      <div className="card animate-fade-in-up flex flex-wrap gap-2 p-4 [animation-delay:40ms]">
        {TRIMESTRES.map((t) => (
          <Link
            key={t}
            href={`/prof/classes/${classeId}/suivi/${eleveId}?trimestre=${t}`}
            className={t === trimestre ? "btn-primary" : "btn-secondary"}
          >
            {TRIMESTRE_LABELS[t]}
            {t === trimestreActuel() ? " (en cours)" : ""}
          </Link>
        ))}
      </div>

      <div className="card animate-fade-in-up p-6 text-center [animation-delay:60ms]">
        {trimestreCourant.moyenne0a5 !== null ? (
          <>
            <div className="flex justify-center">
              <EtoilesAffichage valeur={trimestreCourant.moyenne0a5} taille="h-7 w-7" />
            </div>
            <p className="mt-2 font-heading text-3xl font-extrabold text-ink-primary">
              {trimestreCourant.note20?.toFixed(1) ?? "0.0"}<span className="text-lg text-ink-muted">/20</span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {trimestreCourant.pointsTrimestre} point{trimestreCourant.pointsTrimestre > 1 ? "s" : ""} cumulé
              {trimestreCourant.pointsTrimestre > 1 ? "s" : ""} ce trimestre ·{" "}
              {trimestreCourant.estActuel
                ? "note orale indicative, trimestre en cours"
                : `note orale du ${TRIMESTRE_LABELS[trimestre].toLowerCase()}`}
            </p>
            <div className="mt-4 flex flex-col gap-2 border-t border-space-border pt-4 text-left">
              {(
                [
                  ["travailFait", trimestreCourant.travailFaitAvg],
                  ["compteRendu", trimestreCourant.compteRenduAvg],
                  ["assiduite", trimestreCourant.assiduiteAvg],
                ] as const
              ).map(([critere, moyenne]) => (
                <div key={critere} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink-secondary">{CRITERE_LABELS[critere]}</span>
                  {moyenne !== null ? (
                    <EtoilesAffichage valeur={moyenne} />
                  ) : (
                    <span className="text-xs text-ink-muted">—</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-ink-secondary">Aucune donnée pour ce trimestre pour le moment.</p>
        )}
      </div>

      <section className="card animate-fade-in-up p-6 [animation-delay:100ms]">
        <h2 className="section-title mb-4">Ajouter un point de suivi</h2>
        <EntreeSuiviForm classeId={classeId} eleveId={eleveId} />
      </section>

      {trimestreCourant.entrees.length > 0 && (
        <section className="animate-fade-in-up [animation-delay:140ms]">
          <h2 className="section-title mb-3">Historique — {TRIMESTRE_LABELS[trimestre]}</h2>
          <ul className="flex flex-col gap-3">
            {trimestreCourant.entrees.map((entree) => (
              <li key={entree.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-ink-muted">
                    {entree.date.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  <form action={supprimerEntreeSuiviAction}>
                    <input type="hidden" name="id" value={entree.id} />
                    <input type="hidden" name="classeId" value={classeId} />
                    <input type="hidden" name="eleveId" value={eleveId} />
                    <button
                      type="submit"
                      className="text-ink-muted transition-colors hover:text-red-400"
                      aria-label="Supprimer cette entrée"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {(["travailFait", "assiduite"] as const).map((critere) => (
                    <div key={critere} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink-secondary">{CRITERE_LABELS[critere]}</span>
                      <EtoilesAffichage valeur={entree[critere]} />
                    </div>
                  ))}
                </div>
                {entree.commentaire && (
                  <p className="mt-2 text-sm text-ink-secondary">{entree.commentaire}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {trimestreCourant.comptesRendus.length > 0 && (
        <section className="animate-fade-in-up [animation-delay:160ms]">
          <h2 className="section-title mb-3">Comptes-rendus notés — {TRIMESTRE_LABELS[trimestre]}</h2>
          <ul className="flex flex-col gap-3">
            {trimestreCourant.comptesRendus.map((cr) => (
              <li key={cr.id}>
                <Link
                  href={`/prof/comptes-rendus/${cr.id}`}
                  className="card flex items-center justify-between gap-3 p-4 transition-colors hover:border-neon-blue/50"
                >
                  <div>
                    <p className="font-medium text-ink-primary">{cr.cours.titre}</p>
                    <p className="text-xs text-ink-muted">
                      {cr.dateDepot.toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <EtoilesAffichage valeur={cr.noteEtoiles ?? 0} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
