"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";

type Action = (
  prev: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

export function EmailForm({
  emailActuel,
  action,
}: {
  emailActuel: string;
  action: Action;
}) {
  const [message, formAction, isPending] = useActionState(action, undefined);
  const { addToast } = useToast();
  const reussi = message === "ok";

  useEffect(() => {
    if (!message) return;
    addToast({
      type: reussi ? "success" : "error",
      message: reussi ? "Adresse email mise à jour." : message,
    });
  }, [message, reussi, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="field-label">
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={emailActuel}
          autoComplete="email"
          className="input"
        />
      </div>

      {message && message !== "ok" && (
        <p className="text-sm text-red-400" role="alert">
          {message}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary self-start">
        {isPending ? "Enregistrement…" : "Mettre à jour l'email"}
      </button>
    </form>
  );
}
