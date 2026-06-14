import { Download } from "lucide-react";
import { formaterTaille, listerLogiciels } from "@/lib/logiciels";

export default async function EleveLogicielsPage() {
  const logiciels = await listerLogiciels();

  return (
    <div>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Logiciels à télécharger</h1>
          <p className="text-slate-500">
            Installe ces logiciels sur ton ordinateur pour travailler sur les activités du cours.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {logiciels.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun logiciel disponible pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {logiciels.map((logiciel) => (
                <li
                  key={logiciel.id}
                  className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{logiciel.titre}</p>
                    <p className="whitespace-pre-wrap text-sm text-slate-600">{logiciel.description}</p>
                    {logiciel.fichierTaille != null && (
                      <p className="mt-1 text-xs text-slate-400">{formaterTaille(logiciel.fichierTaille)}</p>
                    )}
                  </div>

                  <a
                    href={logiciel.fichierNom ? `/api/logiciels/${logiciel.id}/fichier` : logiciel.lien ?? "#"}
                    target={logiciel.fichierNom ? undefined : "_blank"}
                    rel={logiciel.fichierNom ? undefined : "noopener noreferrer"}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
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
    </div>
  );
}
