import { Suspense } from "react";
import { Download, FolderOpen } from "lucide-react";
import type { Matiere } from "@prisma/client";
import { estMatiereValide, MATIERE_LABELS } from "@/lib/classes-constants";
import {
  listerDocumentsPartages,
  listerFichiersElevesParMatiere,
  listerDossiersPartages,
} from "@/lib/casier";
import { formaterTaille } from "@/lib/fichiers";
import { formaterNomComplet } from "@/lib/utilisateurs";
import { MatiereTabs } from "@/components/matiere-tabs";
import { CasierExplorer } from "@/components/casier/casier-explorer";
import {
  creerDossierProfAction,
  deplacerDocumentProfAction,
  partagerDocumentAction,
  renommerDossierProfAction,
  supprimerDocumentPartageAction,
  supprimerDocumentProfAction,
  supprimerDossierProfAction,
} from "./actions";

export default async function ProfCasierPage({
  searchParams,
}: {
  searchParams: Promise<{ matiere?: string }>;
}) {
  const { matiere: matiereParam } = await searchParams;
  const matiere: Matiere = estMatiereValide(matiereParam) ? matiereParam : "TECHNOLOGIE";

  const [documentsPartages, dossiersPartages, fichiersEleves] = await Promise.all([
    listerDocumentsPartages(matiere),
    listerDossiersPartages(matiere),
    listerFichiersElevesParMatiere(matiere),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="animate-fade-in-up">
        <h1 className="page-title flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-neon-cyan" />
          Casier numérique
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Partage des documents avec tes élèves, et consulte ceux qu&apos;ils déposent.
        </p>
      </div>

      <Suspense fallback={null}>
        <MatiereTabs matiereActive={matiere} basePath="/prof/casier" storageKey="prof-casier-matiere" />
      </Suspense>

      <section className="card animate-fade-in-up flex flex-col gap-3 p-6">
        <h2 className="section-title">Documents partagés — {MATIERE_LABELS[matiere]}</h2>
        <CasierExplorer
          dossiers={dossiersPartages.map((d) => ({ id: d.id, nom: d.nom, nbDocuments: d._count.documents }))}
          documents={documentsPartages.map((d) => ({ id: d.id, nom: d.nom, taille: d.taille, dossierId: d.dossierId }))}
          onCreerDossier={creerDossierProfAction.bind(null, matiere)}
          onRenommerDossier={renommerDossierProfAction}
          onSupprimerDossier={supprimerDossierProfAction}
          onSupprimerDocument={supprimerDocumentPartageAction}
          onDeplacerDocument={deplacerDocumentProfAction}
          uploadAction={partagerDocumentAction}
          libelleUpload="Partager un document"
          champsCachesUpload={{ matiere }}
        />
      </section>

      <section className="card animate-fade-in-up flex flex-col gap-3 p-6 [animation-delay:60ms]">
        <h2 className="section-title">Fichiers déposés par les élèves</h2>
        {fichiersEleves.length === 0 ? (
          <p className="text-sm text-ink-muted">Aucun fichier déposé pour cette matière.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {fichiersEleves.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-space-border bg-space-surface2/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-primary">{doc.nom}</p>
                  <p className="text-xs text-ink-muted">
                    {doc.eleve ? formaterNomComplet(doc.eleve) : "Élève inconnu"}
                    {doc.eleve?.classe ? ` · ${doc.eleve.classe.nom}` : ""} · {formaterTaille(doc.taille)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/casier/${doc.id}`}
                    title="Télécharger"
                    className="rounded-lg p-1.5 text-ink-muted hover:text-ink-primary"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <form action={supprimerDocumentProfAction}>
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
      </section>
    </div>
  );
}
