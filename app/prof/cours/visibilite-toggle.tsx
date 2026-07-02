"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { basculerVisibiliteElevesAction } from "./actions";

export function VisibiliteToggle({
  coursId,
  visibleEleves,
}: {
  coursId: string;
  visibleEleves: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const formData = new FormData();
    formData.set("coursId", coursId);
    formData.set("visible", String(!visibleEleves));
    startTransition(() => basculerVisibiliteElevesAction(formData));
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={visibleEleves ? "Visible par les élèves — cliquer pour masquer" : "Masqué aux élèves — cliquer pour rendre visible"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
        visibleEleves
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
          : "border-space-border bg-space-surface2/60 text-ink-muted hover:bg-space-surface2"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {visibleEleves ? (
        <Eye className="h-3.5 w-3.5" />
      ) : (
        <EyeOff className="h-3.5 w-3.5" />
      )}
      {visibleEleves ? "Visible" : "Masqué"}
    </button>
  );
}
