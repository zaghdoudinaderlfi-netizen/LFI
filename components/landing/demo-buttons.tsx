"use client";

import { useActionState } from "react";
import { PlayCircle } from "lucide-react";
import { demarrerDemoAction } from "@/app/demo-actions";

function BoutonDemo({ role, label }: { role: "ELEVE" | "PROF"; label: string }) {
  const [errorMessage, formAction, isPending] = useActionState(demarrerDemoAction, undefined);

  return (
    <form action={formAction} className="flex flex-col items-center gap-1">
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        disabled={isPending}
        className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60"
      >
        <PlayCircle className="h-4 w-4" />
        {isPending ? "Chargement…" : label}
      </button>
      {errorMessage && (
        <p className="text-xs text-red-400" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

export function DemoButtons() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <BoutonDemo role="ELEVE" label="Voir la démo élève" />
      <BoutonDemo role="PROF" label="Voir la démo prof" />
    </div>
  );
}
