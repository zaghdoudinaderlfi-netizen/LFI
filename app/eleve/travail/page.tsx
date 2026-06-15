import Link from "next/link";
import { CheckCircle2, ListChecks } from "lucide-react";
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
      <h1 className="page-title animate-fade-in-up">Travail à faire</h1>

      {!user?.classe ? (
        <div className="card animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">
            Tu n&apos;es rattaché à aucune classe pour le moment.
          </p>
        </div>
      ) : devoirs.length === 0 ? (
        <div className="card animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">Aucun devoir pour le moment.</p>
        </div>
      ) : (
        <>
          <section className="card animate-fade-in-up p-6 [animation-delay:60ms]">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-neon-violet" />
              À rendre
            </h2>
            {aFaire.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Tu as rendu tous les devoirs disponibles. 🎉
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {aFaire.map((devoir) => (
                  <li key={devoir.id}>
                    <Link
                      href={`/eleve/cours/${devoir.cours.slug}`}
                      className="card-interactive flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-ink-primary">{devoir.titre}</p>
                        <p className="text-sm text-ink-secondary">{devoir.cours.titre}</p>
                      </div>
                      <div className="text-sm text-ink-muted sm:text-right">
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
          </section>

          {rendus.length > 0 && (
            <section className="card animate-fade-in-up p-6 [animation-delay:120ms]">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Déjà rendus
              </h2>
              <ul className="flex flex-col gap-3">
                {rendus.map((devoir) => (
                  <li key={devoir.id}>
                    <Link
                      href={`/eleve/cours/${devoir.cours.slug}`}
                      className="card-interactive flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-ink-primary">{devoir.titre}</p>
                        <p className="text-sm text-ink-secondary">{devoir.cours.titre}</p>
                      </div>
                      <p
                        className={
                          devoir.soumission?.corrigeManuellement
                            ? "font-heading font-bold text-neon-cyan"
                            : "text-sm text-ink-muted"
                        }
                      >
                        {devoir.soumission?.corrigeManuellement
                          ? `Note : ${devoir.soumission.note} / ${devoir.points}`
                          : "Rendu · en attente de correction"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
