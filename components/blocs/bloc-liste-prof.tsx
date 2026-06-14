import type { Bloc } from "@prisma/client";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { TYPE_BLOC_LABELS, libelleOutil } from "@/lib/blocs";
import { formaterTaille } from "@/lib/fichiers";
import { deplacerBlocAction, supprimerBlocAction } from "@/app/prof/cours/[id]/blocs-actions";

export function BlocListeProf({ coursId, blocs }: { coursId: string; blocs: Bloc[] }) {
  if (blocs.length === 0) {
    return <p className="text-sm text-slate-500">Aucun bloc pour ce cours pour le moment.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {blocs.map((bloc, index) => (
        <li
          key={bloc.id}
          className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {TYPE_BLOC_LABELS[bloc.type]}
            </p>
            <ApercuBloc bloc={bloc} />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <form action={deplacerBlocAction}>
              <input type="hidden" name="id" value={bloc.id} />
              <input type="hidden" name="coursId" value={coursId} />
              <input type="hidden" name="direction" value="haut" />
              <button
                type="submit"
                disabled={index === 0}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Monter le bloc"
                title="Monter"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
            <form action={deplacerBlocAction}>
              <input type="hidden" name="id" value={bloc.id} />
              <input type="hidden" name="coursId" value={coursId} />
              <input type="hidden" name="direction" value="bas" />
              <button
                type="submit"
                disabled={index === blocs.length - 1}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Descendre le bloc"
                title="Descendre"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </form>
            <form action={supprimerBlocAction}>
              <input type="hidden" name="id" value={bloc.id} />
              <input type="hidden" name="coursId" value={coursId} />
              <button
                type="submit"
                className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                aria-label="Supprimer le bloc"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ApercuBloc({ bloc }: { bloc: Bloc }) {
  switch (bloc.type) {
    case "TEXTE":
      return (
        <div
          className="prose prose-slate prose-sm line-clamp-2 max-w-none text-slate-700"
          // Contenu déjà nettoyé (lib/sanitize-html.ts) avant d'être stocké.
          dangerouslySetInnerHTML={{ __html: bloc.contenu ?? "" }}
        />
      );

    case "IMAGE":
    case "PDF":
      return (
        <p className="truncate text-sm text-slate-700">
          {bloc.fichierNom}
          {bloc.fichierTaille != null && ` (${formaterTaille(bloc.fichierTaille)})`}
        </p>
      );

    case "VIDEO":
      return <p className="truncate text-sm text-slate-700">{bloc.contenu}</p>;

    case "EDITEUR_PYTHON":
      return (
        <p className="line-clamp-2 text-sm text-slate-700">
          {bloc.contenu}
          {bloc.codeDepart && <span className="text-slate-400"> — code de départ fourni</span>}
        </p>
      );

    case "ACTIVITE":
      return (
        <p className="truncate text-sm text-slate-700">
          {bloc.titre || `Ouvrir l'activité ${libelleOutil(bloc.outil ?? "")}`}
          <span className="text-slate-400"> — {bloc.contenu}</span>
        </p>
      );

    case "LIEN":
      return (
        <p className="truncate text-sm text-slate-700">
          {bloc.titre}
          <span className="text-slate-400"> — {bloc.contenu}</span>
        </p>
      );

    default:
      return null;
  }
}
