"use client";

import { useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";
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
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={
        correctionVisible
          ? "Corrigé affiché aux élèves — cliquer pour le masquer"
          : "Corrigé masqué aux élèves — cliquer pour l'afficher"
      }
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
        correctionVisible
          ? "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
          : "border-space-border bg-space-surface2/60 text-ink-muted hover:bg-space-surface2"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {correctionVisible ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Circle className="h-3.5 w-3.5" />
      )}
      {correctionVisible ? "Corrigé visible" : "Corrigé masqué"}
    </button>
  );
}
