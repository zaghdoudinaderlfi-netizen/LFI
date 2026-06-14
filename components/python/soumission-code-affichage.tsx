import { TypeExercice } from "@prisma/client";

type DonneesCode = {
  code?: string;
  sortie?: string;
  reussiAuto?: boolean;
};

/**
 * Affichage en lecture seule d'une soumission d'exercice de code (Python /
 * Turtle) côté prof : code soumis, sortie obtenue, et pour Python la sortie
 * attendue + le résultat de la correction automatique.
 */
export function SoumissionCodeAffichage({
  contenu,
  type,
  sortieAttendue,
}: {
  contenu: string | null;
  type: TypeExercice;
  sortieAttendue?: string | null;
}) {
  let donnees: DonneesCode = {};
  if (contenu) {
    try {
      donnees = JSON.parse(contenu);
    } catch {
      donnees = {};
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Code soumis</p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-900 p-3 text-xs text-slate-100">
          {donnees.code || "(aucun code)"}
        </pre>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Sortie obtenue</p>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-100 p-3 text-xs text-slate-700">
          {donnees.sortie || "(aucune sortie)"}
        </pre>
      </div>

      {type === TypeExercice.PYTHON && (
        <>
          {sortieAttendue && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Sortie attendue</p>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-100 p-3 text-xs text-slate-700">
                {sortieAttendue}
              </pre>
            </div>
          )}

          {donnees.reussiAuto !== undefined && (
            <p className={`text-sm font-medium ${donnees.reussiAuto ? "text-green-600" : "text-amber-600"}`}>
              Résultat automatique : {donnees.reussiAuto ? "Réussi ✅" : "Échoué — sortie différente de l'attendu"}
            </p>
          )}
        </>
      )}
    </div>
  );
}
