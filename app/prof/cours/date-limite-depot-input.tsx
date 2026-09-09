"use client";

import { useState, useTransition } from "react";
import { CalendarClock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { modifierDateLimiteDepotAction } from "./actions";

export function DateLimiteDepotInput({
  coursId,
  dateLimiteDepot,
}: {
  coursId: string;
  dateLimiteDepot: string | null;
}) {
  const [valeur, setValeur] = useState(dateLimiteDepot ?? "");
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  function enregistrer(nouvelleValeur: string) {
    if (nouvelleValeur === (dateLimiteDepot ?? "")) return;

    startTransition(async () => {
      const res = await modifierDateLimiteDepotAction(coursId, nouvelleValeur);
      if (res.ok) {
        addToast({
          type: "success",
          message: nouvelleValeur ? "Délai de dépôt enregistré." : "Délai de dépôt retiré.",
        });
      } else {
        setValeur(dateLimiteDepot ?? "");
        addToast({ type: "error", message: res.erreur ?? "Erreur inconnue." });
      }
    });
  }

  return (
    <label
      title="Délai de dépôt — laisser vide pour un dépôt toujours ouvert"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-space-border bg-space-surface2/60 px-2.5 py-1 text-xs font-medium text-ink-muted ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
      <input
        type="date"
        value={valeur}
        disabled={isPending}
        onChange={(e) => setValeur(e.target.value)}
        onBlur={(e) => enregistrer(e.target.value)}
        className="w-[112px] border-none bg-transparent p-0 text-xs text-ink-primary outline-none"
      />
    </label>
  );
}
