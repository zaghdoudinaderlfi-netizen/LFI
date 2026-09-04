"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { basculerVitrineAction } from "./actions";

export function VitrineButton({
  coursId,
  enVitrine,
  estPublic,
}: {
  coursId: string;
  enVitrine: boolean;
  estPublic: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const formData = new FormData();
    formData.set("coursId", coursId);
    formData.set("enVitrine", String(!enVitrine));
    startTransition(() => basculerVitrineAction(formData));
  }

  const desactive = !estPublic && !enVitrine;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending || desactive}
      title={
        !estPublic
          ? "Le cours doit être public pour être mis en vitrine"
          : enVitrine
            ? "Retirer ce cours de la vitrine de l'accueil"
            : "Mettre ce cours en vitrine sur la page d'accueil"
      }
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
        enVitrine
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          : "border-space-border bg-space-surface2/60 text-ink-muted hover:bg-space-surface2"
      } ${isPending || desactive ? "opacity-50" : ""} ${desactive ? "cursor-not-allowed" : ""}`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {enVitrine ? "En vitrine" : "Mettre en vitrine"}
    </button>
  );
}
