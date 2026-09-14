"use client";

import Link from "next/link";
import { useActionState } from "react";
import { demanderReinitMdpAction, reinitialiserMdpAction } from "./actions";

export function ReinitMdpWizard() {
  const [etapeDemande, formActionDemande, pendingDemande] = useActionState(
    demanderReinitMdpAction,
    undefined
  );
  const [etapeFinale, formActionFinale, pendingFinale] = useActionState(
    reinitialiserMdpAction,
    undefined
  );

  if (etapeFinale?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm font-medium text-emerald-400">{etapeFinale.message}</p>
        </div>
        <Link href="/connexion" className="btn-primary self-start">
          Se connecter
        </Link>
      </div>
    );
  }

  if (etapeDemande?.etape === "token") {
    return (
      <form action={formActionFinale} className="flex flex-col gap-4">
        <p className="text-sm text-ink-secondary">
          Identité vérifiée. Choisis ton nouveau mot de passe.
        </p>

        <input type="hidden" name="token" value={etapeDemande.token} />

        <div className="flex flex-col gap-1">
          <label htmlFor="nouveau" className="field-label">
            Nouveau mot de passe
          </label>
          <input
            id="nouveau"
            name="nouveau"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
          <p className="text-xs text-ink-muted">8 caractères minimum.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirmation" className="field-label">
            Confirmer le nouveau mot de passe
          </label>
          <input
            id="confirmation"
            name="confirmation"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </div>

        {etapeFinale && !etapeFinale.ok && (
          <p className="text-sm text-red-400" role="alert">
            {etapeFinale.message}
          </p>
        )}

        <button type="submit" disabled={pendingFinale} className="btn-arcade-primary">
          {pendingFinale ? "Enregistrement…" : "Changer le mot de passe"}
        </button>
      </form>
    );
  }

  return (
    <form action={formActionDemande} className="flex flex-col gap-4">
      <p className="text-sm text-ink-secondary">
        Renseigne ton email et ta date de naissance pour vérifier ton identité.
      </p>

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

      {etapeDemande?.etape === "erreur" && (
        <p className="text-sm text-red-400" role="alert">
          {etapeDemande.message}
        </p>
      )}

      <button type="submit" disabled={pendingDemande} className="btn-arcade-primary">
        {pendingDemande ? "Vérification…" : "Continuer"}
      </button>

      <p className="text-xs text-ink-muted">
        Ta date de naissance n&apos;est pas enregistrée, ou tu ne t&apos;en souviens plus ?
        Demande à ton professeur de réinitialiser ton compte depuis son interface
        d&apos;administration.
      </p>
    </form>
  );
}
