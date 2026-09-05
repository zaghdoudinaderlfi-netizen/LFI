import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { obtenirCompteRendu, lireTravail } from "@/lib/comptes-rendus";
import { MATIERE_LABELS } from "@/lib/cours";
import { NIVEAU_LABELS } from "@/lib/classes";

export default async function CompteRenduDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const compteRendu = await obtenirCompteRendu(id);

  if (!compteRendu) notFound();

  const travail = lireTravail(compteRendu.travail);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-in-up">
        <Link href="/prof/comptes-rendus" className="btn-secondary w-fit">
          <ArrowLeft className="h-4 w-4" />
          Retour aux comptes-rendus
        </Link>
        <a href={`/api/comptes-rendus/${compteRendu.id}/html`} download className="btn-secondary w-fit">
          <Download className="h-4 w-4" />
          Télécharger en HTML
        </a>
      </div>

      <div className="card animate-fade-in-up p-6">
        <h1 className="text-2xl font-extrabold text-ink-primary font-heading">{compteRendu.noms}</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          {compteRendu.classe ? `${compteRendu.classe.nom} · ` : ""}
          {compteRendu.cours.titre} · {MATIERE_LABELS[compteRendu.cours.matiere]} ·{" "}
          {NIVEAU_LABELS[compteRendu.cours.niveau]}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          Déposé le{" "}
          {compteRendu.dateDepot.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {travail.length === 0 ? (
        <div className="card animate-fade-in-up p-6 text-center">
          <p className="text-ink-secondary">
            Aucun travail joint à ce dépôt — l&apos;élève a seulement signalé qu&apos;il avait terminé.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4 animate-fade-in-up [animation-delay:60ms]">
          {travail.map((exercice, index) => (
            <li key={index} className="card p-5">
              <p className="mb-3 font-medium text-ink-primary">{exercice.exercice}</p>
              <pre className="overflow-x-auto rounded-lg border border-space-border bg-space-surface2/60 p-4 text-sm text-ink-primary">
                <code>{exercice.code}</code>
              </pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
