import type { TypeContenuCours, TypeCoursSimple } from "@prisma/client";
import Link from "next/link";
import { Download } from "lucide-react";
import { extraireEmbedVideo } from "@/lib/video";

type CoursContenuProps = {
  cours: {
    id: string;
    typeContenu: TypeContenuCours;
    contenu: string;
    pdfNom: string | null;
    typeSimple: TypeCoursSimple | null;
    fichierUrl: string | null;
    videoUrl: string | null;
    quizId: string | null;
    correctionVisible: boolean;
  };
};

export function CoursContenu({ cours }: CoursContenuProps) {
  // Mode de création simplifié (5 boutons) : contenu stocké dans des champs
  // dédiés (fichierUrl/videoUrl/quizId), indépendants de typeContenu/contenu
  // utilisés par l'éditeur avancé.
  if (cours.typeSimple === "QCM" && cours.quizId) {
    return (
      <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-8 text-center">
        <p className="text-ink-secondary">Ce cours est un quiz.</p>
        <Link href={`/eleve/quiz/${cours.quizId}`} className="btn-primary">
          Lancer le quiz
        </Link>
      </div>
    );
  }

  if (cours.typeSimple === "VIDEO" && cours.videoUrl) {
    const embed = extraireEmbedVideo(cours.videoUrl);
    if (embed) {
      return (
        <div className="mb-6 aspect-video w-full overflow-hidden rounded-xl border border-space-border bg-black">
          <iframe
            src={embed.embedUrl}
            title="Vidéo du cours"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  if (cours.typeSimple === "HTML" && cours.fichierUrl) {
    const src = cours.correctionVisible
      ? `${cours.fichierUrl}${cours.fichierUrl.includes("?") ? "&" : "?"}corrige=1`
      : cours.fichierUrl;
    return (
      <iframe
        src={src}
        title="Contenu du cours"
        className="mb-6 h-[80vh] w-full rounded-xl border border-space-border bg-white"
      />
    );
  }

  if (cours.typeSimple === "PDF" && cours.fichierUrl) {
    return (
      <div className="mb-6 flex flex-col gap-2">
        <iframe
          src={cours.fichierUrl}
          title="Contenu du cours"
          className="h-[80vh] w-full rounded-xl border border-space-border bg-white"
        />
        <a
          href={cours.fichierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link-muted inline-flex items-center gap-1.5 self-start text-xs font-medium"
        >
          <Download className="h-3.5 w-3.5" />
          Télécharger le PDF
        </a>
      </div>
    );
  }

  if (cours.typeSimple === "WORD" && cours.fichierUrl) {
    return (
      <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border border-space-border bg-space-surface2/60 p-8 text-center">
        <p className="text-ink-secondary">Document Word</p>
        <a
          href={cours.fichierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" />
          Télécharger le document
        </a>
      </div>
    );
  }

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
