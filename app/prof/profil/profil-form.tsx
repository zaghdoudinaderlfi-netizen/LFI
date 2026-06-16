"use client";

import { useActionState, useEffect } from "react";
import { modifierProfilProfAction } from "./actions";
import { useToast } from "@/components/ui/toast";

export function ProfilProfForm({
  nom,
  prenom,
}: {
  nom: string;
  prenom: string;
}) {
  const [message, formAction, isPending] = useActionState(
    modifierProfilProfAction,
    undefined,
  );
  const reussi = message === "Profil mis à jour.";
  const { addToast } = useToast();

  useEffect(() => {
    if (!message) return;
    addToast({ type: reussi ? "success" : "error", message });
  }, [message, reussi, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="prenom-prof" className="field-label">
          Prénom
        </label>
        <input
          id="prenom-prof"
          name="prenom"
          type="text"
          defaultValue={prenom}
          autoComplete="given-name"
          className="input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="nom-prof" className="field-label">
          Nom
        </label>
        <input
          id="nom-prof"
          name="nom"
          type="text"
          required
          defaultValue={nom}
          autoComplete="family-name"
          className="input"
        />
      </div>

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
