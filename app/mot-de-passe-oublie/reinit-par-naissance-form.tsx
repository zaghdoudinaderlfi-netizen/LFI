"use client";

import { useActionState } from "react";
import { verifierIdentiteAction } from "./actions";
import { ReinitialiserMdpForm } from "./reinitialiser/[token]/reinitialiser-mdp-form";

/**
 * Flux de réinitialisation en deux temps, sans email : l'élève prouve son
 * identité avec son email + sa date de naissance, puis choisit directement
 * son nouveau mot de passe (même formulaire que le flux par lien email,
 * réutilisé tel quel une fois le token obtenu).
 */
export function ReinitParNaissanceForm() {
  const [etat, formAction, isPending] = useActionState(verifierIdentiteAction, undefined);

  if (etat?.ok && etat.token) {
    return (
      <>
        <p className="mb-6 text-sm text-ink-secondary">
          Identité vérifiée. Choisis ton nouveau mot de passe.
        </p>
        <ReinitialiserMdpForm token={etat.token} />
      </>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-ink-secondary">
        Saisis ton email et ta date de naissance pour choisir un nouveau mot de passe.
      </p>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="identifiant" className="field-label">
            Email
          </label>
          <input
            id="identifiant"
            name="identifiant"
            type="email"
            required
            autoComplete="email"
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dateNaissance" className="field-label">
            Date de naissance
          </label>
          <input
            id="dateNaissance"
            name="dateNaissance"
            type="date"
            required
            autoComplete="bday"
            className="input"
          />
        </div>

        {etat && !etat.ok && etat.erreur && (
          <p className="text-sm text-red-400" role="alert">
            {etat.erreur}
          </p>
        )}

        <button type="submit" disabled={isPending} className="btn-primary mt-2">
          {isPending ? "Vérification…" : "Vérifier mon identité"}
        </button>
      </form>
    </>
  );
}
