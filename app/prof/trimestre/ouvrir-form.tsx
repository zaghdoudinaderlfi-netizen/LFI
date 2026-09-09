"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ouvrirTrimestreAction } from "./actions";

export function OuvrirTrimestreForm({ nomSuggere }: { nomSuggere: string }) {
  const [nom, setNom] = useState(nomSuggere);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !confirm(
        "Ouvrir un nouveau trimestre ?\n\nLa note finale sera de nouveau masquée aux élèves jusqu'à la prochaine clôture. L'historique du trimestre précédent est conservé.",
      )
    )
      return;

    startTransition(async () => {
      const res = await ouvrirTrimestreAction(nom);
      if (res.ok) {
        addToast({ type: "success", message: "Nouveau trimestre ouvert." });
      } else {
        addToast({ type: "error", message: res.erreur ?? "Erreur inconnue." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="nomTrimestre" className="field-label">
          Nom du trimestre
        </label>
        <input
          id="nomTrimestre"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          className="input"
        />
      </div>
      <button type="submit" disabled={isPending} className="btn-secondary gap-2">
        <RotateCcw className="h-4 w-4" />
        {isPending ? "Ouverture..." : "Ouvrir un nouveau trimestre"}
      </button>
    </form>
  );
}
