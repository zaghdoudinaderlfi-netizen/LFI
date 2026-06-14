import { anneeScolaireParDefaut, listerClasses, NIVEAU_LABELS } from "@/lib/classes";
import { ClasseForm } from "../classe-form";

export default async function ProfClassesPage() {
  const classes = await listerClasses();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-800">Mes classes</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Créer une classe
        </h2>
        <ClasseForm anneeScolaireParDefaut={anneeScolaireParDefaut()} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Classes existantes
        </h2>

        {classes.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune classe pour le moment. Crée ta première classe ci-dessus.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {classes.map((classe) => (
              <li
                key={classe.id}
                className="flex flex-col gap-2 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-800">{classe.nom}</p>
                  <p className="text-sm text-slate-500">
                    {NIVEAU_LABELS[classe.niveau]} · {classe.anneeScolaire}{" "}
                    · {classe.nombreEleves}{" "}
                    {classe.nombreEleves > 1 ? "élèves" : "élève"}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    Code d&apos;inscription
                  </span>
                  <span className="rounded-md bg-slate-100 px-3 py-1 font-mono text-lg font-bold text-slate-800">
                    {classe.codeInscription}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
