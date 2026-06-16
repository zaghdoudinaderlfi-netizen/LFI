"use client";

import { useActionState } from "react";
import { demanderReinitAction } from "./actions";

export function DemanderReinitForm() {
  const [message, formAction, isPending] = useActionState(demanderReinitAction, undefined);

  const envoye = message?.startsWith("Si un compte existe");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="field-label">
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          disabled={envoye}
        />
      </div>

      {message && (
        <p
          className={`text-sm ${envoye ? "text-emerald-400" : "text-red-400"}`}
          role="alert"
        >
          {message}
        </p>
      )}

      {!envoye && (
        <button type="submit" disabled={isPending} className="btn-primary mt-2">
          {isPending ? "Envoi en cours…" : "Envoyer le lien"}
        </button>
      )}
    </form>
  );
}
