"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Action = (
  prev: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

/**
 * Import (ou suppression) d'une vraie photo de profil — alternative à
 * l'avatar dessiné, prioritaire sur lui quand elle est renseignée (voir
 * AvatarDisplay). Partagé entre les profils élève et prof : seule l'action
 * serveur passée en prop diffère (chacune vérifie son propre rôle).
 */
export function PhotoAvatarForm({
  action,
  photoActuelle,
}: {
  action: Action;
  photoActuelle: string | null;
}) {
  const [message, formAction, isPending] = useActionState(action, undefined);
  const [
    messageSuppression,
    formActionSuppression,
    suppressionEnCours,
  ] = useActionState(action, undefined);
  const { addToast } = useToast();
  const [apercu, setApercu] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!message) return;
    if (message === "ok") {
      addToast({ type: "success", message: "Photo mise à jour." });
      setApercu(null);
      if (inputRef.current) inputRef.current.value = "";
    } else {
      addToast({ type: "error", message });
    }
  }, [message, addToast]);

  useEffect(() => {
    if (!messageSuppression) return;
    if (messageSuppression === "ok") {
      addToast({ type: "success", message: "Photo supprimée, avatar dessiné rétabli." });
    } else {
      addToast({ type: "error", message: messageSuppression });
    }
  }, [messageSuppression, addToast]);

  const photoAffichee = apercu ?? photoActuelle;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-space-border bg-space-surface2">
        {photoAffichee ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoAffichee} alt="Photo de profil" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs text-ink-muted">
            Aucune
          </span>
        )}
      </span>

      <div className="flex flex-1 flex-col gap-2">
        <form
          action={formAction}
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            const fichier = inputRef.current?.files?.[0];
            if (!fichier) {
              e.preventDefault();
              return;
            }
            setApercu(URL.createObjectURL(fichier));
          }}
        >
          <input
            ref={inputRef}
            type="file"
            name="photo"
            accept="image/png,image/jpeg,image/gif,image/webp"
            required
            className="text-sm text-ink-secondary file:mr-3 file:rounded-lg file:border file:border-space-border file:bg-space-surface2 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-primary hover:file:border-neon-cyan/50"
          />
          <button type="submit" disabled={isPending} className="btn-secondary shrink-0">
            <Upload className="h-4 w-4" />
            {isPending ? "Envoi…" : "Importer"}
          </button>
        </form>

        {photoActuelle && (
          <form action={formActionSuppression}>
            <input type="hidden" name="supprimerPhoto" value="on" />
            <button
              type="submit"
              disabled={suppressionEnCours}
              className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-red-400"
            >
              <X className="h-3.5 w-3.5" />
              Revenir à l&apos;avatar dessiné
            </button>
          </form>
        )}

        <p className="text-xs text-ink-muted">
          PNG, JPG, GIF ou WebP, 5 Mo maximum. Remplace l&apos;avatar dessiné tant qu&apos;elle est active.
        </p>
      </div>
    </div>
  );
}
