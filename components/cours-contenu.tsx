import type { TypeContenuCours } from "@prisma/client";
import { Download } from "lucide-react";

type CoursContenuProps = {
  cours: {
    id: string;
    typeContenu: TypeContenuCours;
    contenu: string;
    pdfNom: string | null;
  };
};

export function CoursContenu({ cours }: CoursContenuProps) {
  if (cours.typeContenu === "PDF") {
    if (!cours.pdfNom) {
      return <p className="text-sm text-ink-muted">Ce cours n&apos;a pas encore de contenu.</p>;
    }

    return (
      <div className="mb-6 flex flex-col gap-2">
        <iframe
          src={`/api/cours/${cours.id}/pdf?inline=1`}
          title={cours.pdfNom}
          className="h-[80vh] w-full rounded-xl border border-space-border bg-white"
        />
        <a
          href={`/api/cours/${cours.id}/pdf`}
          className="link-muted inline-flex items-center gap-1.5 self-start text-xs font-medium"
        >
          <Download className="h-3.5 w-3.5" />
          Télécharger le PDF
        </a>
      </div>
    );
  }

  if (!cours.contenu.trim()) {
    return <p className="text-sm text-ink-muted">Ce cours n&apos;a pas encore de contenu.</p>;
  }

  return (
    <div
      className="prose-cours"
      // Le contenu est nettoyé (rehype-sanitize) avant d'être stocké en base.
      dangerouslySetInnerHTML={{ __html: cours.contenu }}
    />
  );
}
