import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listerCoursPublies, MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";

export default async function EleveCoursPage() {
  const session = await auth();

  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { classe: true },
      })
    : null;

  const cours = user?.classe ? await listerCoursPublies(user.classe.niveau) : [];

  return (
    <div>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Cours</h1>
            <p className="text-slate-500">
              {user?.classe
                ? NIVEAU_LABELS[user.classe.niveau]
                : "Aucune classe associée à ton compte."}
            </p>
          </div>
          <Link
            href="/eleve"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            ← Espace élève
          </Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {!user?.classe ? (
            <p className="text-sm text-slate-500">
              Tu n&apos;es associé à aucune classe pour le moment.
            </p>
          ) : cours.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun cours disponible pour le moment.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {cours.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/eleve/cours/${c.slug}`}
                    className="flex flex-col gap-1 rounded-md border border-slate-200 p-4 hover:bg-slate-50"
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {MATIERE_LABELS[c.matiere]}
                    </span>
                    <span className="font-medium text-slate-800">{c.titre}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
