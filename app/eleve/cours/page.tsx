import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
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
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <p className="eyebrow">
            {user?.classe ? NIVEAU_LABELS[user.classe.niveau] : "Aucune classe associée"}
          </p>
          <h1 className="page-title">Mes cours</h1>
        </div>
        <Link href="/eleve" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Tableau de bord
        </Link>
      </div>

      <div className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        {!user?.classe ? (
          <p className="text-sm text-ink-muted">
            Tu n&apos;es associé à aucune classe pour le moment.
          </p>
        ) : cours.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucun cours disponible pour le moment.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cours.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/eleve/cours/${c.slug}`}
                  className="card-interactive flex h-full flex-col gap-1 p-4"
                >
                  <span className="eyebrow flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    {MATIERE_LABELS[c.matiere]}
                  </span>
                  <span className="font-medium text-ink-primary">{c.titre}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
