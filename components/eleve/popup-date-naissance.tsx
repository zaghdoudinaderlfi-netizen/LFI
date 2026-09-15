"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { modifierDateNaissanceAction } from "@/app/eleve/profil/actions";

export function PopupDateNaissance() {
  const [ferme, setFerme] = useState(false);
  const [message, formAction, isPending] = useActionState(modifierDateNaissanceAction, undefined);
  const enregistre = message === "Date de naissance mise à jour.";

  useEffect(() => {
    if (enregistre) setFerme(true);
  }, [enregistre]);

  if (ferme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-space-border bg-space-surface p-6 shadow-2xl">
        <div className="mb-3 flex items-center gap-2 text-neon-cyan">
          <CalendarDays className="h-5 w-5" />
          <h2 className="font-heading text-lg font-bold text-ink-primary">Date de naissance</h2>
        </div>
        <p className="mb-4 text-sm text-ink-secondary">
          Renseigne ta date de naissance : elle te permettra de réinitialiser ton mot de
          passe toi-même si tu l&apos;oublies un jour, sans attendre ton professeur.
        </p>

        <form action={formAction} className="flex flex-col gap-3">
          <input
            name="dateNaissance"
            type="date"
            required
            autoComplete="bday"
            className="input"
          />

          {message && !enregistre && (
            <p className="text-sm text-red-400" role="alert">
              {message}
            </p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button type="button" onClick={() => setFerme(true)} className="btn-ghost">
              Plus tard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
