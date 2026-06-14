import Link from "next/link";
import { listerCoursProf, MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";

export default async function ProfCoursPage() {
  const cours = await listerCoursProf();

  return (
    <div>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Cours</h1>
            <p className="text-slate-500">
              Crée, édite et publie les cours par niveau et matière.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/prof"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
            >
              ← Espace prof
            </Link>
            <Link
              href="/prof/cours/nouveau"
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Nouveau cours
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {cours.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun cours pour le moment. Crée le premier cours ci-dessus.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {cours.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-800">{c.titre}</p>
                    <p className="text-sm text-slate-500">
                      {NIVEAU_LABELS[c.niveau]} · {MATIERE_LABELS[c.matiere]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        c.publie
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {c.publie ? "Publié" : "Brouillon"}
                    </span>
                    <Link
                      href={`/prof/cours/${c.id}`}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Modifier
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
