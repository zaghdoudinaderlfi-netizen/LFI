import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listerDevoirsAFaire } from "@/lib/devoirs";

export default async function EleveTravailPage() {
  const session = await auth();

  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { classe: true },
      })
    : null;

  const devoirs = user?.classe
    ? await listerDevoirsAFaire(user.id, user.classe.niveau)
    : [];

  const aFaire = devoirs.filter((devoir) => !devoir.soumission);
  const rendus = devoirs.filter((devoir) => devoir.soumission);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-800">Travail à faire</h1>

      {!user?.classe ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-slate-500">
            Tu n&apos;es rattaché à aucune classe pour le moment.
          </p>
        </div>
      ) : devoirs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-slate-500">Aucun devoir pour le moment.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">À rendre</h2>
            {aFaire.length === 0 ? (
              <p className="text-sm text-slate-500">
                Tu as rendu tous les devoirs disponibles. 🎉
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {aFaire.map((devoir) => (
                  <li key={devoir.id}>
                    <Link
                      href={`/eleve/cours/${devoir.cours.slug}`}
                      className="flex flex-col gap-1 rounded-md border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{devoir.titre}</p>
                        <p className="text-sm text-slate-500">{devoir.cours.titre}</p>
                      </div>
                      <div className="text-sm text-slate-500 sm:text-right">
                        <p>Barème : {devoir.points} pts</p>
                        {devoir.dateLimite && (
                          <p>
                            À rendre avant le{" "}
                            {devoir.dateLimite.toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {rendus.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-800">Déjà rendus</h2>
              <ul className="flex flex-col gap-3">
                {rendus.map((devoir) => (
                  <li key={devoir.id}>
                    <Link
                      href={`/eleve/cours/${devoir.cours.slug}`}
                      className="flex flex-col gap-1 rounded-md border border-slate-200 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{devoir.titre}</p>
                        <p className="text-sm text-slate-500">{devoir.cours.titre}</p>
                      </div>
                      <p className="text-sm text-slate-500">
                        {devoir.soumission?.corrigeManuellement
                          ? `Note : ${devoir.soumission.note} / ${devoir.points}`
                          : "Rendu · en attente de correction"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
