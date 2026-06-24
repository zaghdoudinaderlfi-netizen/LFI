import Link from "next/link";
import { ArrowLeft, BookOpen, MonitorPlay } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listerCoursPublies, MATIERE_LABELS, urlImageCouverture } from "@/lib/cours";
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
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cours.map((c) => {
              const estInteractif = !!c.pageInteractive;
              const imageUrl = urlImageCouverture(c.imageCouvertureChemin);

              if (estInteractif) {
                return (
                  <li key={c.id}>
                    <a
                      href={`/cours/${c.pageInteractive}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card-interactive flex h-full flex-col overflow-hidden"
                    >
                      {/* Vignette de couverture */}
                      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-neon-blue/15 to-neon-violet/20">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <MonitorPlay className="h-10 w-10 text-neon-blue/40" />
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 badge bg-neon-blue/20 px-2 text-neon-blue ring-1 ring-neon-blue/40 backdrop-blur-sm">
                          <MonitorPlay className="mr-1 inline h-3 w-3" />
                          Cours interactif
                        </span>
                      </div>

                      {/* Corps de la carte */}
                      <div className="flex flex-col gap-1 p-4">
                        <span className="eyebrow flex items-center gap-1.5 text-neon-blue/70">
                          {MATIERE_LABELS[c.matiere]}
                        </span>
                        <span className="font-medium text-ink-primary">{c.titreInteractif ?? c.titre}</span>
                        <span className="mt-1 text-xs text-ink-muted">Ouvre dans un nouvel onglet</span>
                      </div>
                    </a>
                  </li>
                );
              }

              return (
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
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
