"use client";

import { useActionState, useEffect } from "react";
import { modifierDateNaissanceAction } from "./actions";
import { useToast } from "@/components/ui/toast";

export function DateNaissanceForm({ dateNaissance }: { dateNaissance: string }) {
  const [message, formAction, isPending] = useActionState(modifierDateNaissanceAction, undefined);
  const enregistre = message === "Date de naissance mise à jour.";
  const { addToast } = useToast();

  useEffect(() => {
    if (!message) return;
    addToast({ type: enregistre ? "success" : "error", message });
  }, [message, enregistre, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="dateNaissance" className="field-label">
          Date de naissance
        </label>
        <input
          id="dateNaissance"
          name="dateNaissance"
          type="date"
          required
          defaultValue={dateNaissance}
          autoComplete="bday"
          className="input max-w-xs"
        />
      </div>

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
