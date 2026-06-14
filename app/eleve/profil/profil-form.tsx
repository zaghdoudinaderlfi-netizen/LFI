"use client";

import { useActionState } from "react";
import { modifierProfilAction } from "./actions";

export function ProfilForm({
  nom,
  prenom,
}: {
  nom: string;
  prenom: string;
}) {
  const [message, formAction, isPending] = useActionState(modifierProfilAction, undefined);
  const enregistre = message === "Profil mis à jour.";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="prenom" className="text-sm font-medium text-slate-700">
          Prénom
        </label>
        <input
          id="prenom"
          name="prenom"
          type="text"
          defaultValue={prenom}
          autoComplete="given-name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className="text-sm font-medium text-slate-700">
          Nom
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          required
          defaultValue={nom}
          autoComplete="family-name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>

      {message && (
        <p className={`text-sm ${enregistre ? "text-green-600" : "text-red-600"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
