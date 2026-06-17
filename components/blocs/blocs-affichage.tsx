import type { Bloc } from "@prisma/client";
import { Code2, Download, ExternalLink, FileText } from "lucide-react";
import { nettoyerHtml } from "@/lib/sanitize-html";
import { libelleOutil, urlVideoEmbed } from "@/lib/blocs";
import { CODE_PYTHON_DEFAUT } from "@/lib/python";
import { PythonRunner } from "@/components/python/python-runner";

/**
 * Affichage des blocs d'un cours côté élève (et aperçu prof), dans l'ordre.
 * Le HTML des blocs TEXTE est nettoyé une seconde fois ici (en plus du
 * nettoyage à l'enregistrement, lib/blocs.ts) avant affichage.
 */
export async function BlocsAffichage({ blocs }: { blocs: Bloc[] }) {
  if (blocs.length === 0) return null;

  const elements = await Promise.all(blocs.map((bloc) => afficherBloc(bloc)));

  return <div className="flex flex-col gap-8">{elements}</div>;
}

async function afficherBloc(bloc: Bloc) {
  switch (bloc.type) {
    case "TEXTE": {
      const html = await nettoyerHtml(bloc.contenu ?? "");
      if (!html || html === "<p></p>") return null;

      return (
        <div
          key={bloc.id}
          className="rounded-xl border border-space-border/60 bg-space-surface/60 px-6 py-5"
        >
          <div className="prose-cours" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      );
    }

    case "IMAGE":
      return (
        <figure key={bloc.id} className="group flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/blocs/${bloc.id}/fichier?inline=1`}
            alt={bloc.fichierNom ?? "Image du cours"}
            className="mx-auto max-h-[70vh] w-full rounded-2xl border border-space-border object-contain shadow-lg transition-transform group-hover:scale-[1.01]"
          />
        </figure>
      );

    case "PDF":
      return (
        <div key={bloc.id} className="flex flex-col gap-2">
          <p className="eyebrow flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Document PDF
          </p>
          <iframe
            src={`/api/blocs/${bloc.id}/fichier?inline=1`}
            title={bloc.fichierNom ?? "Document PDF"}
            className="h-[80vh] w-full rounded-xl border border-space-border bg-white"
          />
          <a
            href={`/api/blocs/${bloc.id}/fichier`}
            className="link-muted inline-flex items-center gap-1.5 self-start text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger le PDF
          </a>
        </div>
      );

    case "VIDEO": {
      const url = bloc.contenu ? urlVideoEmbed(bloc.contenu) : null;
      if (!url) return null;

      return (
        <div key={bloc.id} className="overflow-hidden rounded-2xl border border-space-border shadow-lg">
          <div className="aspect-video w-full">
            <iframe
              src={url}
              title="Vidéo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>
      );
    }

    case "EDITEUR_PYTHON":
      return (
        <div key={bloc.id} className="card flex flex-col gap-3 p-4 sm:p-6">
          <p className="eyebrow flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5" />
            Éditeur Python
          </p>
          {bloc.contenu && (
            <p className="whitespace-pre-wrap text-sm text-ink-secondary">{bloc.contenu}</p>
          )}
          <PythonRunner codeInitial={bloc.codeDepart || CODE_PYTHON_DEFAUT} />
        </div>
      );

    case "ACTIVITE":
      return (
        <a
          key={bloc.id}
          href={bloc.contenu ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary justify-center rounded-2xl py-4 text-base font-semibold shadow-glow-violet transition-all hover:shadow-glow-cyan text-center"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {bloc.titre || `Ouvrir l'activité ${libelleOutil(bloc.outil ?? "")}`}
        </a>
      );

    case "LIEN":
      return (
        <a
          key={bloc.id}
          href={bloc.contenu ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="card-interactive flex items-center gap-3 px-5 py-4 text-sm font-medium text-neon-cyan hover:underline"
        >
          <ExternalLink className="h-5 w-5 shrink-0" />
          {bloc.titre}
        </a>
      );

    default:
      return null;
  }
}
