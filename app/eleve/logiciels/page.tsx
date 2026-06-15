import { Download } from "lucide-react";
import { formaterTaille, listerLogiciels } from "@/lib/logiciels";

export default async function EleveLogicielsPage() {
  const logiciels = await listerLogiciels();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="animate-fade-in-up">
        <h1 className="page-title mb-1">Logiciels à télécharger</h1>
        <p className="text-ink-secondary">
          Installe ces logiciels sur ton ordinateur pour travailler sur les activités du cours.
        </p>
      </div>

      <div className="card animate-fade-in-up p-6 [animation-delay:60ms]">
        {logiciels.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun logiciel disponible pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {logiciels.map((logiciel) => (
              <li
                key={logiciel.id}
                className="flex flex-col gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink-primary">{logiciel.titre}</p>
                  <p className="whitespace-pre-wrap text-sm text-ink-secondary">{logiciel.description}</p>
                  {logiciel.fichierTaille != null && (
                    <p className="mt-1 text-xs text-ink-muted">{formaterTaille(logiciel.fichierTaille)}</p>
                  )}
                </div>

                <a
                  href={logiciel.fichierNom ? `/api/logiciels/${logiciel.id}/fichier` : logiciel.lien ?? "#"}
                  target={logiciel.fichierNom ? undefined : "_blank"}
                  rel={logiciel.fichierNom ? undefined : "noopener noreferrer"}
                  className="btn-primary shrink-0"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
