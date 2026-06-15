import Link from "next/link";
import { ArrowLeft, Package, PlusCircle } from "lucide-react";
import { listerLogiciels } from "@/lib/logiciels";
import { LogicielForm } from "./logiciel-form";
import { LogicielItem } from "./logiciel-item";

export default async function ProfLogicielsPage() {
  const logiciels = await listerLogiciels();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 animate-fade-in-up sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title mb-1">Logiciels à télécharger</h1>
          <p className="text-ink-secondary">
            Gère la liste des logiciels proposés au téléchargement aux élèves (lien externe ou fichier hébergé).
          </p>
        </div>
        <Link href="/prof" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Espace prof
        </Link>
      </div>

      <section className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:60ms]">
        <h2 className="section-title flex items-center gap-2">
          <Package className="h-5 w-5 text-neon-cyan" />
          Liste des logiciels
        </h2>

        {logiciels.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun logiciel pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {logiciels.map((logiciel, index) => (
              <LogicielItem key={logiciel.id} logiciel={logiciel} index={index} total={logiciels.length} />
            ))}
          </ul>
        )}
      </section>

      <section className="card animate-fade-in-up flex flex-col gap-4 p-6 [animation-delay:120ms]">
        <h2 className="section-title flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-neon-violet" />
          Ajouter un logiciel
        </h2>
        <LogicielForm />
      </section>
    </div>
  );
}
