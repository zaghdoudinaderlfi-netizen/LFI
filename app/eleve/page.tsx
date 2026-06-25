import Link from "next/link";
import { Award, BookOpen, ListChecks } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listerDerniersCoursPublies, MATIERE_LABELS } from "@/lib/cours";
import { listerDevoirsAFaire } from "@/lib/devoirs";
import { listerNotesEleve } from "@/lib/soumissions";
import { NIVEAU_LABELS } from "@/lib/classes";
import { configAvatarUtilisateur, genererAvatarSvg } from "@/lib/avatar";
import { Mascotte } from "@/components/mascotte/mascotte";
import type { Matiere } from "@prisma/client";

const MATIERE_STYLE: Record<Matiere, React.CSSProperties> = {
  TECHNOLOGIE: { color: "rgb(var(--techno-txt))" },
  SNT:         { color: "rgb(var(--snt-txt))" },
  NSI:         { color: "rgb(var(--nsi-txt))" },
};

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

  const svgMascotte = user
    ? genererAvatarSvg(configAvatarUtilisateur(user), user.id, 96)
    : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* En-tête avec avatar / mascotte */}
      <div className="flex items-center gap-4 animate-fade-in-up">
        {svgMascotte ? (
          <Mascotte svgAvatar={svgMascotte} prenom={user?.prenom} />
        ) : null}
        <div>
          <p className="font-mono text-xs font-bold tracking-widest" style={{ color: "rgb(var(--snt-txt))" }}>
            // BONJOUR
          </p>
          <h1 className="page-title">
            {user?.prenom?.trim() || user?.nom?.split(" ")[0] || ""} 👋
          </h1>
          {user?.classe && (
            <p className="text-sm text-ink-secondary">
              {user.classe.nom} · {NIVEAU_LABELS[user.classe.niveau]}
            </p>
          )}
        </div>
      </div>

      {!user?.classe ? (
        <div className="card-hard animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">
            Tu n&apos;es rattaché à aucune classe pour le moment.
          </p>
        </div>
      ) : (
        <>
          {/* Derniers cours — accent SNT cyan */}
          <section className="card-hard card-hard-snt animate-fade-in-up p-6 [animation-delay:60ms]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title flex items-center gap-2">
                <BookOpen className="h-5 w-5" style={{ color: "rgb(var(--arcade-snt))" }} />
                Derniers cours
              </h2>
              <Link href="/eleve/cours" className="text-sm font-medium hover:underline" style={{ color: "rgb(var(--snt-txt))" }}>
                Voir tout
              </Link>
            </div>

            {derniersCours.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucun cours publié pour le moment.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {derniersCours.map((cours) => (
                  <li key={cours.id}>
                    <Link
                      href={`/eleve/cours/${cours.slug}`}
                      className="item-arcade flex h-full flex-col gap-1 p-4"
                    >
                      <p className="font-mono text-[11px] font-bold uppercase tracking-wide" style={MATIERE_STYLE[cours.matiere]}>
                        {MATIERE_LABELS[cours.matiere]}
                      </p>
                      <p className="font-medium text-ink-primary">{cours.titre}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Devoirs à rendre — accent NSI magenta */}
          <section className="card-hard card-hard-nsi animate-fade-in-up p-6 [animation-delay:120ms]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title flex items-center gap-2">
                <ListChecks className="h-5 w-5" style={{ color: "rgb(var(--arcade-nsi))" }} />
                Devoirs à rendre
              </h2>
              <Link href="/eleve/travail" className="text-sm font-medium hover:underline" style={{ color: "rgb(var(--nsi-txt))" }}>
                Voir tout
              </Link>
            </div>

            {devoirsAFaire.length === 0 ? (
              <p className="text-sm text-ink-muted">Rien à faire pour le moment. 🎉</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {devoirsAFaire.map((devoir) => (
                  <li key={devoir.id}>
                    <Link
                      href={`/eleve/cours/${devoir.cours.slug}`}
                      className="item-arcade flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-ink-primary">{devoir.titre}</p>
                        <p className="text-sm text-ink-secondary">{devoir.cours.titre}</p>
                      </div>
                      {devoir.dateLimite && (
                        <p className="text-sm text-ink-muted">
                          À rendre avant le {devoir.dateLimite.toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Dernières notes — accent Techno ambre */}
          <section className="card-hard card-hard-techno animate-fade-in-up p-6 [animation-delay:180ms]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title flex items-center gap-2">
                <Award className="h-5 w-5" style={{ color: "rgb(var(--arcade-techno))" }} />
                Dernières notes
              </h2>
              <Link href="/eleve/notes" className="text-sm font-medium hover:underline" style={{ color: "rgb(var(--techno-txt))" }}>
                Voir tout
              </Link>
            </div>

            {dernieresNotes.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucune note pour le moment.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dernieresNotes.map((soumission) => (
                  <li key={soumission.id}>
                    <Link
                      href={`/eleve/cours/${soumission.exercice.cours.slug}`}
                      className="item-arcade flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-ink-primary">{soumission.exercice.titre}</p>
                        <p className="text-sm text-ink-secondary">{soumission.exercice.cours.titre}</p>
                      </div>
                      <p className="font-heading font-bold text-ink-primary">
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
