"use client";

import { useTransition } from "react";
import { Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cloturerTrimestreAction } from "./actions";

export function CloturerTrimestreButton() {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  function handleClick() {
    if (!confirm("Les notes finales deviendront visibles aux élèves. Confirmer ?")) return;

    startTransition(async () => {
      const res = await cloturerTrimestreAction();
      if (res.ok) {
        addToast({ type: "success", message: "Trimestre clôturé — les notes finales sont visibles aux élèves." });
      } else {
        addToast({ type: "error", message: res.erreur ?? "Erreur inconnue." });
      }
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={isPending} className="btn-primary gap-2">
      <Lock className="h-4 w-4" />
      {isPending ? "Clôture..." : "Clôturer le trimestre"}
    </button>
  );
}
