import Link from "next/link";
import { listerComptesRendus, TriComptesRendus } from "@/lib/comptes-rendus";
import { MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";

export default async function ComptesRendusPage({
  searchParams,
}: {
  searchParams: Promise<{ tri?: string }>;
}) {
  const { tri: triParam } = await searchParams;
  const tri: TriComptesRendus = triParam === "cours" ? "cours" : "date";

  const comptesRendus = await listerComptesRendus(tri);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="page-title animate-fade-in-up">Comptes-rendus</h1>

      <div className="flex animate-fade-in-up gap-2 [animation-delay:40ms]">
        <Link
          href="/prof/comptes-rendus?tri=date"
          className={tri === "date" ? "btn-primary" : "btn-secondary"}
        >
          Trier par date
        </Link>
        <Link
          href="/prof/comptes-rendus?tri=cours"
          className={tri === "cours" ? "btn-primary" : "btn-secondary"}
        >
          Trier par cours
        </Link>
      </div>

      {comptesRendus.length === 0 ? (
        <div className="card animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">Aucun compte-rendu déposé pour le moment.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 animate-fade-in-up [animation-delay:60ms]">
          {comptesRendus.map((cr) => (
            <li key={cr.id}>
              <Link
                href={`/prof/comptes-rendus/${cr.id}`}
                className="card flex flex-col gap-1 p-5 transition-colors hover:border-neon-blue/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink-primary">{cr.noms}</p>
                  <p className="mt-1 text-sm text-ink-secondary">
                    {cr.cours.titre} · {MATIERE_LABELS[cr.cours.matiere]} · {NIVEAU_LABELS[cr.cours.niveau]}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end">
                  <p className="text-xs text-ink-muted">
                    Déposé le{" "}
                    {cr.dateDepot.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span className="mt-1 text-xs text-neon-cyan">
                    {cr.travail ? "Voir le travail →" : "Sans travail joint"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
