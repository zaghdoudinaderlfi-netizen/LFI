"use client";

import { useActionState } from "react";
import { PlayCircle } from "lucide-react";
import { demarrerDemoAction } from "@/app/demo-actions";

/* Même palette que landing-page.tsx (constantes locales, pas exportées). */
const BG = "#0d0926";
const SNT = "#3dd6f5";

function BoutonDemo({ role, label }: { role: "ELEVE" | "PROF"; label: string }) {
  const [errorMessage, formAction, isPending] = useActionState(demarrerDemoAction, undefined);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1.5">
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        disabled={isPending}
        className="btn-arcade inline-flex cursor-pointer items-center gap-2 rounded-[13px] border-2 px-[22px] py-3.5 font-heading text-[16px] font-bold disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: SNT, color: "#0a1a1f", borderColor: BG }}
      >
        <PlayCircle className="h-5 w-5" />
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
    <div className="flex flex-wrap items-center gap-3">
      <BoutonDemo role="ELEVE" label="Voir la démo élève" />
      <BoutonDemo role="PROF" label="Voir la démo prof" />
    </div>
  );
}
