"use client";

import { useActionState } from "react";
import { PlayCircle } from "lucide-react";
import { demarrerDemoAction } from "@/app/demo-actions";

/* Même palette que landing-page.tsx (constantes locales, pas exportées). */
const INK2 = "#1d1652";
const VIOLET = "#c89bff";

function BoutonDemo({ role, label }: { role: "ELEVE" | "PROF"; label: string }) {
  const [errorMessage, formAction, isPending] = useActionState(demarrerDemoAction, undefined);

  return (
    <form action={formAction} className="flex flex-col items-center gap-1.5">
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        disabled={isPending}
        className="btn-arcade inline-flex cursor-pointer items-center gap-2 rounded-[12px] border-2 px-4 py-2.5 font-heading text-[14px] font-bold disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: INK2, color: VIOLET, borderColor: VIOLET }}
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
      <BoutonDemo role="ELEVE" label="Démo élève" />
      <BoutonDemo role="PROF" label="Démo prof" />
    </div>
  );
}
