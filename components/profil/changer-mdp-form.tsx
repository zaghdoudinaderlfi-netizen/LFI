"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";

type Action = (
  prev: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

export function ChangerMdpForm({ action }: { action: Action }) {
  const [message, formAction, isPending] = useActionState(action, undefined);
  const { addToast } = useToast();
  const reussi = message === "ok";

  useEffect(() => {
    if (!message) return;
    if (reussi) {
      addToast({ type: "success", message: "Mot de passe modifié avec succès." });
    } else {
      addToast({ type: "error", message });
    }
  }, [message, reussi, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="ancien" className="field-label">
          Mot de passe actuel
        </label>
        <input
          id="ancien"
          name="ancien"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>

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

      {message && message !== "ok" && (
        <p className="text-sm text-red-400" role="alert">
          {message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
