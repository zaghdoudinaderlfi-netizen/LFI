"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { type CamaradeClasse } from "@/lib/groupes";
import { deposerSoumissionAction } from "./soumissions-actions";
import { CoequipierSelecteur } from "./coequipier-selecteur";
import { useToast } from "@/components/ui/toast";
import { SuccessBurst } from "@/components/ui/success-burst";

export function DevoirSoumissionForm({
  exerciceId,
  slug,
  camarades,
  coequipiers,
}: {
  exerciceId: string;
  slug: string;
  camarades: CamaradeClasse[];
  coequipiers: string[];
}) {
  const [message, formAction, isPending] = useActionState(deposerSoumissionAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const depose = message === "Devoir déposé.";
  const { addToast } = useToast();
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (depose) {
      formRef.current?.reset();
      addToast({ type: "success", message: "Devoir déposé avec succès !" });
      setShowBurst(true);
      const timeout = setTimeout(() => setShowBurst(false), 700);
      return () => clearTimeout(timeout);
    }
    if (message) {
      addToast({ type: "error", message });
    }
  }, [depose, message, addToast]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3"
    >
      <input type="hidden" name="exerciceId" value={exerciceId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={`fichier-${exerciceId}`} className="field-label">
          Déposer ton fichier
        </label>
        <input
          id={`fichier-${exerciceId}`}
          name="fichier"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          required
          className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
        />
        <p className="text-xs text-ink-muted">PDF ou photo (jpg, png, webp), 10 Mo maximum.</p>
      </div>
      <div className="sm:basis-full">
        <CoequipierSelecteur camarades={camarades} defautCoequipiers={coequipiers} />
      </div>
      <button type="submit" disabled={isPending} className="btn-primary">
        <Upload className="h-4 w-4" />
        {isPending ? "Envoi..." : "Déposer"}
      </button>
      <SuccessBurst show={showBurst} />
      {message && (
        <p
          className={`text-sm sm:basis-full ${depose ? "text-emerald-400" : "text-red-400"}`}
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
