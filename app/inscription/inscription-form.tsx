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
        <label htmlFor="prenom" className="field-label">
          Prénom
        </label>
        <input
          id="prenom"
          name="prenom"
          type="text"
          required
          autoComplete="given-name"
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className="field-label">
          Nom
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          required
          autoComplete="family-name"
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="motDePasse" className="field-label">
          Mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
        <p className="text-xs text-ink-muted">8 caractères minimum.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="codeInscription" className="field-label">
          Code de classe
        </label>
        <input
          id="codeInscription"
          name="codeInscription"
          type="text"
          required
          placeholder="Fourni par votre professeur"
          className="input uppercase"
        />
      </div>

      {message && (
        <p className="text-sm text-red-400" role="alert">
          {message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary mt-2">
        {isPending ? "Création..." : "Créer mon compte"}
      </button>
    </form>
  );
}
