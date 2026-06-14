import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listerDerniersCoursPublies, MATIERE_LABELS } from "@/lib/cours";
import { listerDevoirsAFaire } from "@/lib/devoirs";
import { listerNotesEleve } from "@/lib/soumissions";
import { NIVEAU_LABELS } from "@/lib/classes";

export default async function ElevePage() {
  const session = await auth();

  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { classe: true },
      })
    : null;

  const [derniersCours, devoirs, notes] = user?.classe
    ? await Promise.all([
        listerDerniersCoursPublies(user.classe.niveau, 3),
        listerDevoirsAFaire(user.id, user.classe.niveau),
        listerNotesEleve(user.id),
      ])
    : [[], [], []];

  const devoirsAFaire = devoirs.filter((devoir) => !devoir.soumission).slice(0, 4);
  const dernieresNotes = notes.slice(0, 4);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Bonjour {user?.prenom?.trim() || user?.nom?.split(" ")[0] || ""} 👋
        </h1>
        {user?.classe && (
          <p className="text-sm text-slate-500">
            {user.classe.nom} · {NIVEAU_LABELS[user.classe.niveau]}
          </p>
        )}
      </div>

      {!user?.classe ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-slate-500">
            Tu n&apos;es rattaché à aucune classe pour le moment.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Derniers cours</h2>
              <Link href="/eleve/cours" className="text-sm text-slate-500 hover:underline">
                Voir tout
              </Link>
            </div>

            {derniersCours.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun cours publié pour le moment.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {derniersCours.map((cours) => (
                  <li key={cours.id}>
                    <Link
                      href={`/eleve/cours/${cours.slug}`}
                      className="flex h-full flex-col gap-1 rounded-md border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {MATIERE_LABELS[cours.matiere]}
                      </p>
                      <p className="font-medium text-slate-800">{cours.titre}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Devoirs à rendre</h2>
              <Link href="/eleve/travail" className="text-sm text-slate-500 hover:underline">
                Voir tout
              </Link>
            </div>

            {devoirsAFaire.length === 0 ? (
              <p className="text-sm text-slate-500">Rien à faire pour le moment. 🎉</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {devoirsAFaire.map((devoir) => (
                  <li key={devoir.id}>
                    <Link
                      href={`/eleve/cours/${devoir.cours.slug}`}
                      className="flex flex-col gap-1 rounded-md border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{devoir.titre}</p>
                        <p className="text-sm text-slate-500">{devoir.cours.titre}</p>
                      </div>
                      {devoir.dateLimite && (
                        <p className="text-sm text-slate-500">
                          À rendre avant le {devoir.dateLimite.toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Dernières notes</h2>
              <Link href="/eleve/notes" className="text-sm text-slate-500 hover:underline">
                Voir tout
              </Link>
            </div>

            {dernieresNotes.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune note pour le moment.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dernieresNotes.map((soumission) => (
                  <li key={soumission.id}>
                    <Link
                      href={`/eleve/cours/${soumission.exercice.cours.slug}`}
                      className="flex flex-col gap-1 rounded-md border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{soumission.exercice.titre}</p>
                        <p className="text-sm text-slate-500">{soumission.exercice.cours.titre}</p>
                      </div>
                      <p className="font-bold text-slate-800">
                        {soumission.note} / {soumission.exercice.points}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
