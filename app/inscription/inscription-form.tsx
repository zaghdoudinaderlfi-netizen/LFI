"use client";

import { useActionState } from "react";
import { inscrire } from "./actions";

export function InscriptionForm() {
  const [message, formAction, isPending] = useActionState(
    inscrire,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className="text-sm font-medium text-slate-700">
          Nom
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          required
          autoComplete="name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="motDePasse"
          className="text-sm font-medium text-slate-700"
        >
          Mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <p className="text-xs text-slate-400">8 caractères minimum.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="codeInscription"
          className="text-sm font-medium text-slate-700"
        >
          Code de classe
        </label>
        <input
          id="codeInscription"
          name="codeInscription"
          type="text"
          required
          placeholder="Fourni par votre professeur"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-slate-400"
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
        {isPending ? "Création..." : "Créer mon compte"}
      </button>
    </form>
  );
}
