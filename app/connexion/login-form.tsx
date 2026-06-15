"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        <label htmlFor="password" className="field-label">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary mt-2">
        {isPending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
