"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { basculerCorrectionVisibleAction } from "./actions";

export function CorrectionToggle({
  coursId,
  correctionVisible,
}: {
  coursId: string;
  correctionVisible: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const formData = new FormData();
    formData.set("coursId", coursId);
    formData.set("correctionVisible", String(!correctionVisible));
    startTransition(() => basculerCorrectionVisibleAction(formData));
  }

  return (
    <span
      title={
        correctionVisible
          ? "Corrigé affiché aux élèves — cliquer pour le masquer"
          : "Corrigé masqué aux élèves — cliquer pour l'afficher"
      }
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
        correctionVisible
          ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
          : "border-space-border bg-space-surface2/60 text-ink-muted"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {correctionVisible ? "Corrigé visible" : "Corrigé masqué"}
      <Switch
        checked={correctionVisible}
        onChange={handleToggle}
        disabled={isPending}
        label="Afficher le corrigé aux élèves"
      />
    </span>
  );
}
