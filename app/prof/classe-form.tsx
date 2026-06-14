"use client";

import { useActionState } from "react";
import { creerClasseAction } from "./actions";

export function ClasseForm({
  anneeScolaireParDefaut,
}: {
  anneeScolaireParDefaut: string;
}) {
  const [message, formAction, isPending] = useActionState(
    creerClasseAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className="text-sm font-medium text-slate-700">
          Nom de la classe
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          required
          placeholder="ex. 3ème A"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="niveau"
          className="text-sm font-medium text-slate-700"
        >
          Niveau
        </label>
        <select
          id="niveau"
          name="niveau"
          required
          defaultValue="TROISIEME"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="TROISIEME">3ème</option>
          <option value="SECONDE">2nde</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="anneeScolaire"
          className="text-sm font-medium text-slate-700"
        >
          Année scolaire
        </label>
        <input
          id="anneeScolaire"
          name="anneeScolaire"
          type="text"
          required
          pattern="\d{4}-\d{4}"
          defaultValue={anneeScolaireParDefaut}
          placeholder="ex. 2025-2026"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      {message && (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Création..." : "Créer la classe"}
      </button>
    </form>
  );
}
