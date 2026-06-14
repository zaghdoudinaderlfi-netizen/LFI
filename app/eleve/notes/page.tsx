import Link from "next/link";
import { auth } from "@/auth";
import { listerNotesEleve } from "@/lib/soumissions";

export default async function EleveNotesPage() {
  const session = await auth();

  const notes = session?.user?.id
    ? await listerNotesEleve(session.user.id)
    : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-800">Mes notes</h1>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-slate-500">Aucune note pour le moment.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((soumission) => (
            <li key={soumission.id}>
              <Link
                href={`/eleve/cours/${soumission.exercice.cours.slug}`}
                className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-800">{soumission.exercice.titre}</p>
                  <p className="text-sm text-slate-500">{soumission.exercice.cours.titre}</p>
                  {soumission.feedback && (
                    <p className="mt-1 text-sm text-slate-600">
                      Commentaire : {soumission.feedback}
                    </p>
                  )}
                </div>
                <p className="text-lg font-bold text-slate-800 sm:text-right">
                  {soumission.note} / {soumission.exercice.points}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
