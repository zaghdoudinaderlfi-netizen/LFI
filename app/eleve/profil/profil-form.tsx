"use client";

import { useActionState, useEffect } from "react";
import { modifierProfilAction } from "./actions";
import { useToast } from "@/components/ui/toast";

export function ProfilForm({
  nom,
  prenom,
}: {
  nom: string;
  prenom: string;
}) {
  const [message, formAction, isPending] = useActionState(modifierProfilAction, undefined);
  const enregistre = message === "Profil mis à jour.";
  const { addToast } = useToast();

  useEffect(() => {
    if (!message) return;
    addToast({ type: enregistre ? "success" : "error", message });
  }, [message, enregistre, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="prenom" className="field-label">
          Prénom
        </label>
        <input
          id="prenom"
          name="prenom"
          type="text"
          defaultValue={prenom}
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
          defaultValue={nom}
          autoComplete="family-name"
          className="input"
        />
      </div>

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </button>

      {message && (
        <p className={`text-sm ${enregistre ? "text-emerald-400" : "text-red-400"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
