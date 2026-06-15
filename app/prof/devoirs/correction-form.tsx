"use client";

import { useActionState, useEffect, useState } from "react";
import { noterSoumissionAction } from "./actions";
import { useToast } from "@/components/ui/toast";
import { SuccessBurst } from "@/components/ui/success-burst";

export function CorrectionForm({
  soumissionId,
  bareme,
}: {
  soumissionId: string;
  bareme: number;
}) {
  const [message, formAction, isPending] = useActionState(noterSoumissionAction, undefined);
  const corrige = message === "Copie corrigée.";
  const { addToast } = useToast();
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (corrige) {
      addToast({ type: "success", message: "Note enregistrée !" });
      setShowBurst(true);
      const timeout = setTimeout(() => setShowBurst(false), 700);
      return () => clearTimeout(timeout);
    }
    if (message) {
      addToast({ type: "error", message });
    }
  }, [corrige, message, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
      <input type="hidden" name="id" value={soumissionId} />

      <div className="flex flex-col gap-1">
        <label htmlFor={`note-${soumissionId}`} className="field-label">
          Note (/{bareme})
        </label>
        <input
          id={`note-${soumissionId}`}
          name="note"
          type="number"
          min={0}
          max={bareme}
          step="0.5"
          required
          className="input w-24"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={`feedback-${soumissionId}`} className="field-label">
          Commentaire (facultatif)
        </label>
        <input
          id={`feedback-${soumissionId}`}
          name="feedback"
          type="text"
          placeholder="Visible par l'élève"
          className="input"
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Envoi..." : "Valider"}
        </button>
        <SuccessBurst show={showBurst} />
      </div>

      {message && (
        <p
          className={`text-sm sm:basis-full ${corrige ? "text-emerald-400" : "text-red-400"}`}
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
