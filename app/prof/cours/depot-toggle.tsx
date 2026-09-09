"use client";

import { useTransition } from "react";
import { Inbox, Circle } from "lucide-react";
import { basculerDepotActiveAction } from "./actions";

export function DepotToggle({
  coursId,
  depotActive,
}: {
  coursId: string;
  depotActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const formData = new FormData();
    formData.set("coursId", coursId);
    formData.set("depotActive", String(!depotActive));
    startTransition(() => basculerDepotActiveAction(formData));
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={
        depotActive
          ? "Widget de dépôt de compte-rendu affiché aux élèves — cliquer pour le retirer"
          : "Widget de dépôt de compte-rendu absent — cliquer pour l'activer"
      }
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
        depotActive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
          : "border-space-border bg-space-surface2/60 text-ink-muted hover:bg-space-surface2"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {depotActive ? <Inbox className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
      {depotActive ? "Dépôt activé" : "Dépôt désactivé"}
    </button>
  );
}
