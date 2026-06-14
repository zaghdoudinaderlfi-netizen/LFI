"use client";

import { useState } from "react";
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => previsualisable && setOuvert((v) => !v)}
          disabled={!previsualisable}
          className={`flex min-w-0 items-center gap-2 text-left text-sm ${
            previsualisable ? "font-medium text-blue-600 hover:underline" : "font-medium text-slate-700"
          }`}
        >
          <span>{estPdf ? "📄" : estImage ? "🖼️" : "📎"}</span>
          <span className="truncate">{nom}</span>
          <span className="text-xs font-normal text-slate-400">({formaterTaille(taille)})</span>
          {previsualisable && <span className="text-xs text-slate-400">{ouvert ? "▲" : "▼"}</span>}
        </button>
        <a href={urlBase} className="text-xs font-medium text-slate-500 hover:underline">
          Télécharger
        </a>
      </div>

      {ouvert && estPdf && (
        <iframe
          src={`${urlBase}?inline=1`}
          title={nom}
          className="h-[70vh] w-full rounded-md border border-slate-200"
        />
      )}

      {ouvert && estImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${urlBase}?inline=1`}
          alt={nom}
          className="max-h-[70vh] w-full rounded-md border border-slate-200 object-contain"
        />
      )}
    </div>
  );
}
