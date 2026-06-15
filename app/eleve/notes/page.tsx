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
      <h1 className="page-title animate-fade-in-up">Mes notes</h1>

      {notes.length === 0 ? (
        <div className="card animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">Aucune note pour le moment.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 animate-fade-in-up [animation-delay:60ms]">
          {notes.map((soumission) => (
            <li key={soumission.id}>
              <Link
                href={`/eleve/cours/${soumission.exercice.cours.slug}`}
                className="card-interactive flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink-primary">{soumission.exercice.titre}</p>
                  <p className="text-sm text-ink-secondary">{soumission.exercice.cours.titre}</p>
                  {soumission.feedback && (
                    <p className="mt-1 text-sm text-ink-secondary">
                      Commentaire : {soumission.feedback}
                    </p>
                  )}
                </div>
                <p className="font-heading text-lg font-bold text-neon-cyan sm:text-right">
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
