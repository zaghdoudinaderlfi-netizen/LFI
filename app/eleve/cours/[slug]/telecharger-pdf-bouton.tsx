"use client";

import { Download } from "lucide-react";

/**
 * Ouvre la version imprimable du cours dans un nouvel onglet et déclenche
 * directement la boîte de dialogue d'impression du navigateur — l'élève
 * choisit "Enregistrer en PDF" comme destination. Alternative sans coût ni
 * risque de timeout serverless à une génération PDF côté serveur (voir la
 * discussion dans app/api/cours/[id]/telecharger-html/route.ts : le plan
 * Vercel Hobby limite les fonctions à 10s, insuffisant pour Puppeteer).
 */
export function TelechargerPdfBouton({ coursId }: { coursId: string }) {
  function handleClick() {
    const fenetre = window.open(`/api/cours/${coursId}/telecharger-html?apercu=1`, "_blank");
    if (!fenetre) return;
    fenetre.addEventListener("load", () => {
      fenetre.focus();
      fenetre.print();
    });
  }

  return (
    <button type="button" onClick={handleClick} className="btn-secondary w-fit">
      <Download className="h-4 w-4" />
      Télécharger (PDF)
    </button>
  );
}
