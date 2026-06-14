import Link from "next/link";
import { creerCoursAction } from "../actions";
import { CoursForm } from "../cours-form";

export default function NouveauCoursPage() {
  return (
    <div>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <Link href="/prof/cours" className="text-sm text-slate-500 hover:underline">
            ← Retour aux cours
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            Nouveau cours
          </h1>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <CoursForm action={creerCoursAction} submitLabel="Créer le cours" />
        </div>
      </div>
    </div>
  );
}
