"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { PageViewport } from "pdfjs-dist";
import {
  ChampFormulaire,
  formaterLabelChamp,
  PREFIXE_CHAMP_FORMULAIRE,
  RectanglePdf,
} from "@/lib/formulaire-champs";

type PageRendue = { largeur: number; hauteur: number; image: string; viewport: PageViewport };

// Convertit le rectangle (repère PDF, origine en bas à gauche) d'un champ en
// position/taille CSS dans la page rendue (repère écran, origine en haut à
// gauche), en respectant l'échelle et la rotation de la page.
function styleDePosition(viewport: PageViewport, rect: RectanglePdf): CSSProperties {
  const [x1, y1, x2, y2] = viewport.convertToViewportRectangle([
    rect.x,
    rect.y,
    rect.x + rect.largeur,
    rect.y + rect.hauteur,
  ]);

  return {
    position: "absolute",
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

// Affiche le PDF-formulaire du devoir (rendu avec pdf.js) et superpose, à la
// position exacte de chaque champ AcroForm lu avec pdf-lib, un élément de
// saisie HTML. Aucun champ n'est ajouté sous le document : l'élève remplit
// directement les zones de texte / cases à cocher présentes dans le PDF.
export function FormulairePdfOverlay({
  pdfUrl,
  champs,
  reponses,
}: {
  pdfUrl: string;
  champs: ChampFormulaire[];
  reponses: Record<string, string | boolean>;
}) {
  const [pages, setPages] = useState<PageRendue[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const compteur = useRef(0);

  useEffect(() => {
    let annule = false;

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        const rendues: PageRendue[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          }

          rendues.push({
            largeur: viewport.width,
            hauteur: viewport.height,
            image: canvas.toDataURL("image/png"),
            viewport,
          });
        }

        if (!annule) setPages(rendues);
      } catch {
        if (!annule) setErreur("Impossible d'afficher le PDF de ce devoir.");
      }
    })();

    return () => {
      annule = true;
    };
  }, [pdfUrl]);

  if (erreur) {
    return <p className="text-sm text-red-600">{erreur}</p>;
  }

  if (!pages) {
    return <p className="text-sm text-slate-500">Chargement du PDF…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {pages.map((page, indexPage) => (
        <div
          key={indexPage}
          className="relative w-full overflow-x-auto rounded-md border border-slate-200 bg-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.image}
            alt={`Page ${indexPage + 1} du PDF-formulaire`}
            width={page.largeur}
            height={page.hauteur}
            className="block"
            style={{ width: page.largeur, height: page.hauteur }}
          />

          {champs.flatMap((champ) => {
            const valeur = reponses[champ.nom] ?? champ.valeur;
            const label = formaterLabelChamp(champ.nom);
            const nomChamp = `${PREFIXE_CHAMP_FORMULAIRE}${champ.nom}`;

            return champ.positions
              .filter((position) => position.page === indexPage)
              .map((position) => {
                const style = styleDePosition(page.viewport, position.rect);
                const id = `champ-pdf-${compteur.current++}`;

                if (champ.type === "texte") {
                  return champ.multiligne ? (
                    <textarea
                      key={id}
                      id={id}
                      name={nomChamp}
                      title={label}
                      aria-label={label}
                      defaultValue={typeof valeur === "string" ? valeur : ""}
                      style={style}
                      className="resize-none border border-blue-400/70 bg-blue-50/50 p-0.5 text-[10px] leading-tight text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      key={id}
                      id={id}
                      type="text"
                      name={nomChamp}
                      title={label}
                      aria-label={label}
                      defaultValue={typeof valeur === "string" ? valeur : ""}
                      style={style}
                      className="border border-blue-400/70 bg-blue-50/50 px-1 text-[10px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  );
                }

                if (champ.type === "case") {
                  return (
                    <input
                      key={id}
                      id={id}
                      type="checkbox"
                      name={nomChamp}
                      title={label}
                      aria-label={label}
                      defaultChecked={valeur === true}
                      style={style}
                      className="cursor-pointer accent-blue-600"
                    />
                  );
                }

                // champ.type === "choix"
                if (position.valeurOption !== undefined) {
                  // Groupe de boutons radio : une entrée par option/position.
                  return (
                    <input
                      key={id}
                      id={id}
                      type="radio"
                      name={nomChamp}
                      title={`${label} : ${position.valeurOption}`}
                      aria-label={`${label} : ${position.valeurOption}`}
                      value={position.valeurOption}
                      defaultChecked={valeur === position.valeurOption}
                      style={style}
                      className="cursor-pointer accent-blue-600"
                    />
                  );
                }

                return (
                  <select
                    key={id}
                    id={id}
                    name={nomChamp}
                    title={label}
                    aria-label={label}
                    defaultValue={typeof valeur === "string" ? valeur : ""}
                    style={style}
                    className="border border-blue-400/70 bg-blue-50/50 text-[10px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">—</option>
                    {champ.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                );
              });
          })}
        </div>
      ))}
    </div>
  );
}
