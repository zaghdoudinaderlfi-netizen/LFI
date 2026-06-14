import type { TypeContenuCours } from "@prisma/client";

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
      return <p className="text-sm text-slate-500">Ce cours n&apos;a pas encore de contenu.</p>;
    }

    return (
      <div className="mb-6 flex flex-col gap-2">
        <iframe
          src={`/api/cours/${cours.id}/pdf?inline=1`}
          title={cours.pdfNom}
          className="h-[80vh] w-full rounded-md border border-slate-200"
        />
        <a
          href={`/api/cours/${cours.id}/pdf`}
          className="self-start text-xs font-medium text-slate-500 hover:underline"
        >
          Télécharger le PDF
        </a>
      </div>
    );
  }

  if (!cours.contenu.trim()) {
    return <p className="text-sm text-slate-500">Ce cours n&apos;a pas encore de contenu.</p>;
  }

  return (
    <div
      className="prose prose-slate max-w-none"
      // Le contenu est nettoyé (rehype-sanitize) avant d'être stocké en base.
      dangerouslySetInnerHTML={{ __html: cours.contenu }}
    />
  );
}
