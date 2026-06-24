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
        <label htmlFor="nom" className="field-label">
          Nom de la classe
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          required
          placeholder="ex. 3ème A"
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="niveau" className="field-label">
          Niveau
        </label>
        <select id="niveau" name="niveau" required defaultValue="TROISIEME" className="input">
          <option value="TROISIEME">3ème — Technologie</option>
          <option value="SECONDE">2nde — SNT</option>
          <option value="PREMIERE">1ère — NSI</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="anneeScolaire" className="field-label">
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
          className="input"
        />
      </div>

      {message && (
        <p className="text-sm text-red-400" role="alert">
          {message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary mt-2 self-start">
        {isPending ? "Création..." : "Créer la classe"}
      </button>
    </form>
  );
}
