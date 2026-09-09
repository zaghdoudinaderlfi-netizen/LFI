import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Lock } from "lucide-react";
import { obtenirCycleActif, listerCyclesPrecedents, suggererNomCycle } from "@/lib/trimestre";
import { CloturerTrimestreButton } from "./cloturer-button";
import { OuvrirTrimestreForm } from "./ouvrir-form";

export default async function ProfTrimestrePage() {
  const [cycleActif, precedents] = await Promise.all([
    obtenirCycleActif(),
    listerCyclesPrecedents(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/prof" className="btn-secondary w-fit animate-fade-in-up">
        <ArrowLeft className="h-4 w-4" />
        Tableau de bord
      </Link>

      <div className="animate-fade-in-up">
        <h1 className="page-title flex items-center gap-2">
          <CalendarClock className="h-6 w-6" style={{ color: "rgb(var(--neon-violet))" }} />
          Trimestre
        </h1>
        <p className="text-sm text-ink-secondary">
          Tant que le trimestre n&apos;est pas clôturé, les élèves voient leurs scores individuels
          par quiz/exercice mais pas de note finale /20 calculée.
        </p>
      </div>

      <section className="card-hard card-hard-violet animate-fade-in-up p-6 [animation-delay:60ms]">
        {!cycleActif ? (
          <>
            <h2 className="section-title mb-2">Aucun trimestre ouvert</h2>
            <p className="mb-4 text-sm text-ink-secondary">
              Ouvre un premier trimestre pour démarrer le suivi. La note finale restera masquée
              aux élèves jusqu&apos;à sa clôture.
            </p>
            <OuvrirTrimestreForm nomSuggere={suggererNomCycle()} />
          </>
        ) : cycleActif.cloture ? (
          <>
            <h2 className="section-title mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              {cycleActif.nom} — clôturé
            </h2>
            <p className="mb-4 text-sm text-ink-secondary">
              Clôturé le{" "}
              {cycleActif.dateCloture?.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
              . La note finale /20 est visible aux élèves. Ouvre un nouveau trimestre pour
              recommencer un cycle.
            </p>
            <OuvrirTrimestreForm nomSuggere={suggererNomCycle()} />
          </>
        ) : (
          <>
            <h2 className="section-title mb-2 flex items-center gap-2">
              <Lock className="h-5 w-5" style={{ color: "rgb(var(--neon-violet))" }} />
              {cycleActif.nom} — en cours
            </h2>
            <p className="mb-4 text-sm text-ink-secondary">
              La note finale /20 est actuellement masquée aux élèves. Clôture le trimestre pour la
              rendre visible.
            </p>
            <CloturerTrimestreButton />
          </>
        )}
      </section>

      {precedents.length > 0 && (
        <section className="animate-fade-in-up [animation-delay:100ms]">
          <h2 className="section-title mb-3">Historique</h2>
          <ul className="flex flex-col gap-3">
            {precedents.map((cycle) => (
              <li key={cycle.id} className="card flex items-center justify-between gap-3 p-4">
                <p className="font-medium text-ink-primary">{cycle.nom}</p>
                <p className="text-xs text-ink-muted">
                  {cycle.cloture
                    ? `Clôturé le ${cycle.dateCloture?.toLocaleDateString("fr-FR")}`
                    : "Non clôturé"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
