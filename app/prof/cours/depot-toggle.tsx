"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
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
    <span
      title={
        depotActive
          ? "Widget de dépôt de compte-rendu affiché aux élèves — cliquer pour le retirer"
          : "Widget de dépôt de compte-rendu absent — cliquer pour l'activer"
      }
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
        depotActive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-space-border bg-space-surface2/60 text-ink-muted"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {depotActive ? "Dépôt activé" : "Dépôt désactivé"}
      <Switch
        checked={depotActive}
        onChange={handleToggle}
        disabled={isPending}
        label="Activer le dépôt de compte-rendu"
      />
    </span>
  );
}
