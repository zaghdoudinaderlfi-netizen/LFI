"use client";

import { useTransition } from "react";
import { Globe, Lock } from "lucide-react";
import { basculerEstPublicAction } from "./actions";

export function EstPublicToggle({
  coursId,
  estPublic,
}: {
  coursId: string;
  estPublic: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const formData = new FormData();
    formData.set("coursId", coursId);
    formData.set("estPublic", String(!estPublic));
    startTransition(() => basculerEstPublicAction(formData));
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={
        estPublic
          ? "Accessible sans connexion via /decouvrir — cliquer pour rendre privé"
          : "Privé — cliquer pour rendre accessible sans connexion"
      }
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
        estPublic
          ? "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20"
          : "border-space-border bg-space-surface2/60 text-ink-muted hover:bg-space-surface2"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {estPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
      {estPublic ? "Public" : "Privé"}
    </button>
  );
}
