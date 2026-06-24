import Link from "next/link";
import { ArrowLeft, BookOpen, MonitorPlay, PlusCircle } from "lucide-react";
import { listerCoursProf, MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";

export default async function ProfCoursPage() {
  const cours = await listerCoursProf();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 animate-fade-in-up sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title mb-1">Cours</h1>
          <p className="text-ink-secondary">
            Crée, édite et publie les cours par niveau et matière.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/prof" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Espace prof
          </Link>
          <Link href="/prof/cours/nouveau" className="btn-primary">
            <PlusCircle className="h-4 w-4" />
            Nouveau cours
          </Link>
        </div>
      </div>

      <div className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        {cours.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucun cours pour le moment. Crée le premier cours ci-dessus.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {cours.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 rounded-xl border border-space-border bg-space-surface2/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="eyebrow mb-1 flex items-center gap-1.5">
                    {c.pageInteractive ? (
                      <MonitorPlay className="h-3.5 w-3.5 text-neon-blue" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5" />
                    )}
                    {MATIERE_LABELS[c.matiere]}
                    {c.pageInteractive && (
                      <span className="badge bg-neon-blue/15 px-2 text-neon-blue ring-1 ring-neon-blue/30">
                        Interactif
                      </span>
                    )}
                  </p>
                  <p className="font-medium text-ink-primary">{c.titre}</p>
                  <p className="text-sm text-ink-secondary">{NIVEAU_LABELS[c.niveau]}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`badge px-3 ${
                      c.publie
                        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                        : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                    }`}
                  >
                    {c.publie ? "Publié" : "Brouillon"}
                  </span>
                  <Link href={`/prof/cours/${c.id}`} className="btn-secondary">
                    Modifier
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
