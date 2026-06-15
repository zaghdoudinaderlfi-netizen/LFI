"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Download, FileText, Image as ImageIcon, Paperclip } from "lucide-react";
import { formaterTaille } from "@/lib/fichiers";

export function ApercuFichier({
  nom,
  taille,
  typeMime,
  urlBase,
}: {
  nom: string;
  taille: number;
  typeMime: string;
  urlBase: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const estPdf = typeMime === "application/pdf";
  const estImage = typeMime.startsWith("image/");
  const previsualisable = estPdf || estImage;
  const Icone = estPdf ? FileText : estImage ? ImageIcon : Paperclip;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => previsualisable && setOuvert((v) => !v)}
          disabled={!previsualisable}
          className={`flex min-w-0 items-center gap-2 text-left text-sm ${
            previsualisable ? "font-medium text-neon-cyan hover:underline" : "font-medium text-ink-primary"
          }`}
        >
          <Icone className="h-4 w-4 shrink-0" />
          <span className="truncate">{nom}</span>
          <span className="text-xs font-normal text-ink-muted">({formaterTaille(taille)})</span>
          {previsualisable && (
            ouvert ? <ChevronUp className="h-3.5 w-3.5 text-ink-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
          )}
        </button>
        <a href={urlBase} className="link-muted inline-flex items-center gap-1.5 text-xs font-medium">
          <Download className="h-3.5 w-3.5" />
          Télécharger
        </a>
      </div>

      {ouvert && estPdf && (
        <iframe
          src={`${urlBase}?inline=1`}
          title={nom}
          className="h-[70vh] w-full rounded-xl border border-space-border bg-white"
        />
      )}

      {ouvert && estImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${urlBase}?inline=1`}
          alt={nom}
          className="max-h-[70vh] w-full rounded-xl border border-space-border object-contain"
        />
      )}
    </div>
  );
}
