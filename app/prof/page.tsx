import Link from "next/link";
import { compterSoumissionsACorriger, listerSoumissionsRecentes } from "@/lib/soumissions";
import { listerClasses, NIVEAU_LABELS } from "@/lib/classes";
import { formaterNomComplet } from "@/lib/utilisateurs";

export default async function ProfPage() {
  const [aCorrigerCount, recentes, classes] = await Promise.all([
    compterSoumissionsACorriger(),
    listerSoumissionsRecentes(5),
    listerClasses(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/prof/cours/nouveau"
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <p className="font-bold text-slate-800">+ Créer un cours</p>
          <p className="mt-1 text-sm text-slate-500">
            Ajoute un nouveau cours de Technologie ou SNT.
          </p>
        </Link>

        <Link
          href="/prof/cours"
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <p className="font-bold text-slate-800">+ Créer un devoir</p>
          <p className="mt-1 text-sm text-slate-500">
            Ajoute un devoir depuis la page d&apos;un de tes cours.
          </p>
        </Link>
      </div>

      <Link
        href="/prof/devoirs"
        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-800">Copies à corriger</h2>
          <p className="text-sm text-slate-500">
            Travaux remis par les élèves, en attente de correction.
          </p>
        </div>
        <p className="text-3xl font-bold text-slate-800">{aCorrigerCount}</p>
      </Link>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Derniers travaux remis</h2>

        {recentes.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun travail remis pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recentes.map((soumission) => (
              <li key={soumission.id}>
                <Link
                  href="/prof/devoirs"
                  className="flex flex-col gap-1 rounded-md border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-800">{soumission.exercice.titre}</p>
                    <p className="text-sm text-slate-500">
                      {soumission.exercice.cours.titre} · {formaterNomComplet(soumission.eleve)}
                    </p>
                  </div>
                  <div className="text-sm text-slate-500 sm:text-right">
                    <p>{soumission.createdAt.toLocaleDateString("fr-FR")}</p>
                    <p className={soumission.corrigeManuellement ? "text-green-600" : "text-amber-600"}>
                      {soumission.corrigeManuellement ? "Corrigé" : "À corriger"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Mes classes</h2>
          <Link href="/prof/classes" className="text-sm text-slate-500 hover:underline">
            Gérer
          </Link>
        </div>

        {classes.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune classe pour le moment.{" "}
            <Link href="/prof/classes" className="underline">
              Crée ta première classe
            </Link>
            .
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
                    {NIVEAU_LABELS[classe.niveau]} · {classe.anneeScolaire} ·{" "}
                    {classe.nombreEleves} {classe.nombreEleves > 1 ? "élèves" : "élève"}
                  </p>
                </div>
                <span className="rounded-md bg-slate-100 px-3 py-1 font-mono text-sm font-bold text-slate-800">
                  {classe.codeInscription}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
