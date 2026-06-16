"use client";

import { useActionState } from "react";
import Link from "next/link";
import { reinitialiserMdpAction } from "../../actions";

export function ReinitialiserMdpForm({ token }: { token: string }) {
  const [message, formAction, isPending] = useActionState(
    reinitialiserMdpAction,
    undefined,
  );

  const reussi = message === "ok";

  if (reussi) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Ton mot de passe a bien été modifié. Tu peux maintenant te connecter.
        </p>
        <Link href="/connexion" className="btn-primary text-center">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

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
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmation" className="field-label">
          Confirmer le mot de passe
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

      {message && message !== "ok" && (
        <p className="text-sm text-red-400" role="alert">
          {message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary mt-2">
        {isPending ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
