"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { modifierPageInteractiveAction } from "./page-interactive-actions";

export function PageInteractiveForm({
  coursId,
  pageInteractive,
  titreInteractif,
  imageCouvertureUrl,
  fichiersDisponibles,
  correctionVisible,
}: {
  coursId: string;
  pageInteractive: string | null;
  titreInteractif: string | null;
  imageCouvertureUrl: string | null;
  fichiersDisponibles: string[];
  correctionVisible: boolean;
}) {
  const [message, formAction, isPending] = useActionState(modifierPageInteractiveAction, undefined);
  const { addToast } = useToast();
  const [apercu, setApercu] = useState<string | null>(null);
  const [supprimerImage, setSupprimerImage] = useState(false);
  const [corrVisible, setCorrVisible] = useState(correctionVisible);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!message) return;
    if (message === "Enregistré.") {
      addToast({ type: "success", message: "Page interactive mise à jour." });
      setApercu(null);
      setSupprimerImage(false);
    } else {
      addToast({ type: "error", message });
    }
  }, [message, addToast]);

  const imageActuelle = supprimerImage ? null : (apercu ?? imageCouvertureUrl);

  return (
    <form action={formAction} className="flex flex-col gap-4" encType="multipart/form-data">
      <input type="hidden" name="coursId" value={coursId} />
      {supprimerImage && <input type="hidden" name="supprimerImage" value="on" />}

      {/* Titre du chapitre */}
      <div className="flex flex-col gap-1">
        <label htmlFor="titreInteractif" className="field-label">
          Titre du chapitre <span className="text-ink-muted font-normal">(affiché sur la carte élève)</span>
        </label>
        <input
          id="titreInteractif"
          name="titreInteractif"
          type="text"
          defaultValue={titreInteractif ?? ""}
          placeholder="Ex : Chapitre 1 — Arithmétique, variables, instructions"
          className="input"
        />
      </div>

      {/* Sélection du fichier interactif */}
      <div className="flex flex-col gap-1">
        <label htmlFor="pageInteractive" className="field-label">
          Fichier HTML interactif (depuis <code className="text-neon-cyan">public/cours/</code>)
        </label>
        {fichiersDisponibles.length > 0 ? (
          <select
            id="pageInteractive"
            name="pageInteractive"
            defaultValue={pageInteractive ?? ""}
            className="input"
          >
            <option value="">— Aucun —</option>
            {fichiersDisponibles.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-ink-muted">
            Aucun fichier <code>.html</code> trouvé dans <code>public/cours/</code>.
          </p>
        )}
      </div>

      {/* Image de couverture */}
      <div className="flex flex-col gap-2">
        <label htmlFor="imageCouverture" className="field-label">
          Image de couverture
        </label>

        {imageActuelle && (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageActuelle}
              alt="Aperçu couverture"
              className="h-28 w-48 rounded-xl border border-space-border object-cover shadow"
            />
            <button
              type="button"
              onClick={() => {
                setSupprimerImage(true);
                setApercu(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute -right-2 -top-2 rounded-full bg-red-500/80 p-1 text-white hover:bg-red-500"
              title="Supprimer l'image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          id="imageCouverture"
          name="imageCouverture"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="input file:mr-3 file:rounded file:border-0 file:bg-space-surface file:px-3 file:py-1 file:text-sm file:text-ink-primary"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setSupprimerImage(false);
              setApercu(URL.createObjectURL(f));
            } else {
              setApercu(null);
            }
          }}
        />
        <p className="text-xs text-ink-muted">PNG, JPG, WebP — 5 Mo max. Affiché en vignette dans la liste des cours.</p>
      </div>

      {/* Interrupteur corrections */}
      {pageInteractive && (
        <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
          <div
            role="switch"
            aria-checked={corrVisible}
            onClick={() => setCorrVisible((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${corrVisible ? "bg-neon-blue" : "bg-space-border"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${corrVisible ? "translate-x-5" : "translate-x-0"}`}
            />
          </div>
          <span className="text-sm font-medium text-ink-secondary">
            Corrections visibles :{" "}
            <span className={corrVisible ? "text-neon-blue font-semibold" : "text-ink-muted"}>
              {corrVisible ? "oui" : "non"}
            </span>
          </span>
          <input type="hidden" name="correctionVisible" value={corrVisible ? "on" : "off"} />
        </label>
      )}

      {fichiersDisponibles.length > 0 && (
        <button type="submit" disabled={isPending} className="btn-primary self-start">
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      )}
    </form>
  );
}
