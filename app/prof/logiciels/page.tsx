import Link from "next/link";
import { listerLogiciels } from "@/lib/logiciels";
import { LogicielForm } from "./logiciel-form";
import { LogicielItem } from "./logiciel-item";

export default async function ProfLogicielsPage() {
  const logiciels = await listerLogiciels();

  return (
    <div>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Logiciels à télécharger</h1>
            <p className="text-slate-500">
              Gère la liste des logiciels proposés au téléchargement aux élèves (lien externe ou fichier hébergé).
            </p>
          </div>
          <Link
            href="/prof"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            ← Espace prof
          </Link>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Liste des logiciels</h2>

          {logiciels.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun logiciel pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {logiciels.map((logiciel, index) => (
                <LogicielItem key={logiciel.id} logiciel={logiciel} index={index} total={logiciels.length} />
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Ajouter un logiciel</h2>
          <LogicielForm />
        </div>
      </div>
    </div>
  );
}
