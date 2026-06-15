import { PlusCircle, Users } from "lucide-react";
import { anneeScolaireParDefaut, listerClasses, NIVEAU_LABELS } from "@/lib/classes";
import { ClasseForm } from "../classe-form";

export default async function ProfClassesPage() {
  const classes = await listerClasses();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="page-title animate-fade-in-up">Mes classes</h1>

      <section className="card animate-fade-in-up p-6">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-neon-cyan" />
          Créer une classe
        </h2>
        <ClasseForm anneeScolaireParDefaut={anneeScolaireParDefaut()} />
      </section>

      <section className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-neon-violet" />
          Classes existantes
        </h2>

        {classes.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucune classe pour le moment. Crée ta première classe ci-dessus.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {classes.map((classe) => (
              <li
                key={classe.id}
                className="card-interactive flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink-primary">{classe.nom}</p>
                  <p className="text-sm text-ink-secondary">
                    {NIVEAU_LABELS[classe.niveau]} · {classe.anneeScolaire}{" "}
                    · {classe.nombreEleves}{" "}
                    {classe.nombreEleves > 1 ? "élèves" : "élève"}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <span className="eyebrow mb-1">Code d&apos;inscription</span>
                  <span className="rounded-md bg-space-surface2 px-3 py-1 font-mono text-lg font-bold text-neon-cyan">
                    {classe.codeInscription}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
