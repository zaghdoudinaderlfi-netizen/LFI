import { redirect } from "next/navigation";
import { Download, FolderOpen } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listerDocumentsPartages, listerFichiersEleve } from "@/lib/casier";
import { MATIERE_PAR_NIVEAU, MATIERE_LABELS } from "@/lib/classes-constants";
import { formaterTaille } from "@/lib/fichiers";
import { CasierUploadForm } from "./casier-upload-form";
import { supprimerFichierEleveAction } from "./actions";

export default async function EleveCasierPage() {
  const session = await auth();
  if (session?.user?.role !== "ELEVE") redirect("/prof");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { classe: { select: { niveau: true } } },
  });

  if (!user?.classe) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="page-title flex items-center gap-2 animate-fade-in-up">
          <FolderOpen className="h-6 w-6 text-neon-cyan" />
          Casier
        </h1>
        <p className="card animate-fade-in-up p-6 text-sm text-ink-muted">
          Tu dois être rattaché à une classe pour utiliser ton casier.
        </p>
      </div>
    );
  }

  const matiere = MATIERE_PAR_NIVEAU[user.classe.niveau];
  const [documentsPartages, mesFichiers] = await Promise.all([
    listerDocumentsPartages(matiere),
    listerFichiersEleve(session.user.id),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="animate-fade-in-up">
        <h1 className="page-title flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-neon-cyan" />
          Casier
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Documents partagés par ton prof, et tes propres fichiers.
        </p>
      </div>

      <section className="card animate-fade-in-up flex flex-col gap-3 p-6">
        <h2 className="section-title">Partagés par ton prof — {MATIERE_LABELS[matiere]}</h2>
        {documentsPartages.length === 0 ? (
          <p className="text-sm text-ink-muted">Rien pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {documentsPartages.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-space-border bg-space-surface2/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-primary">{doc.nom}</p>
                  <p className="text-xs text-ink-muted">{formaterTaille(doc.taille)}</p>
                </div>
                <a href={`/api/casier/${doc.id}`} className="btn-ghost gap-1.5 py-1 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card animate-fade-in-up flex flex-col gap-3 p-6 [animation-delay:60ms]">
        <h2 className="section-title">Mes fichiers</h2>
        {mesFichiers.length === 0 ? (
          <p className="text-sm text-ink-muted">Tu n&apos;as encore rien déposé.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mesFichiers.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-space-border bg-space-surface2/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-primary">{doc.nom}</p>
                  <p className="text-xs text-ink-muted">{formaterTaille(doc.taille)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/casier/${doc.id}`}
                    title="Télécharger"
                    className="rounded-lg p-1.5 text-ink-muted hover:text-ink-primary"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <form action={supprimerFichierEleveAction}>
                    <input type="hidden" name="id" value={doc.id} />
                    <button type="submit" className="text-sm font-medium text-red-400 hover:underline">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <CasierUploadForm />
      </section>
    </div>
  );
}
