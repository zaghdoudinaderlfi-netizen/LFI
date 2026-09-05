import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Trimestre } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NIVEAU_LABELS } from "@/lib/classes";
import { TRIMESTRE_LABELS, trimestreActuel, listerElevesAvecSuiviClasse } from "@/lib/suivi-oral";
import { EtoilesAffichage } from "@/components/suivi/etoiles";

const TRIMESTRES: Trimestre[] = ["T1", "T2", "T3"];

function estTrimestreValide(valeur: string | undefined): valeur is Trimestre {
  return valeur === "T1" || valeur === "T2" || valeur === "T3";
}

export default async function SuiviClassePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ trimestre?: string }>;
}) {
  const { id: classeId } = await params;
  const { trimestre: trimestreParam } = await searchParams;
  const trimestre = estTrimestreValide(trimestreParam) ? trimestreParam : trimestreActuel();

  const classe = await prisma.classe.findUnique({
    where: { id: classeId },
    select: { id: true, nom: true, niveau: true },
  });
  if (!classe) notFound();

  const eleves = await listerElevesAvecSuiviClasse(classeId, trimestre);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/prof/classes" className="btn-secondary w-fit animate-fade-in-up">
        <ArrowLeft className="h-4 w-4" />
        Retour aux classes
      </Link>

      <div className="animate-fade-in-up">
        <h1 className="page-title">Suivi oral — {classe.nom}</h1>
        <p className="text-sm text-ink-secondary">{NIVEAU_LABELS[classe.niveau]}</p>
      </div>

      <div className="card animate-fade-in-up flex flex-wrap gap-2 p-4 [animation-delay:40ms]">
        {TRIMESTRES.map((t) => (
          <Link
            key={t}
            href={`/prof/classes/${classeId}/suivi?trimestre=${t}`}
            className={t === trimestre ? "btn-primary" : "btn-secondary"}
          >
            {TRIMESTRE_LABELS[t]}
            {t === trimestreActuel() ? " (en cours)" : ""}
          </Link>
        ))}
      </div>

      {eleves.length === 0 ? (
        <div className="card animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">Aucun élève dans cette classe pour le moment.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 animate-fade-in-up [animation-delay:60ms]">
          {eleves.map((eleve) => (
            <li key={eleve.id}>
              <Link
                href={`/prof/classes/${classeId}/suivi/${eleve.id}?trimestre=${trimestre}`}
                className="card flex items-center justify-between gap-4 p-4 transition-colors hover:border-neon-blue/50"
              >
                <div>
                  <p className="font-medium text-ink-primary">
                    {eleve.prenom ? `${eleve.prenom} ${eleve.nom}` : eleve.nom}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {eleve.nombreEntrees === 0
                      ? "Aucune entrée ce trimestre"
                      : `${eleve.nombreEntrees} entrée${eleve.nombreEntrees > 1 ? "s" : ""}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {eleve.moyenne0a5 !== null ? (
                    <div className="flex flex-col items-end gap-1">
                      <EtoilesAffichage valeur={eleve.moyenne0a5} />
                      <span className="text-xs font-bold text-ink-secondary">
                        {eleve.note20 !== null ? `${eleve.note20.toFixed(1)}/20` : "—"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-muted">—</span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
