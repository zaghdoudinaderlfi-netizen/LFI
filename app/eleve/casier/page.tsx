import { redirect } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  listerDocumentsPartages,
  listerFichiersEleve,
  listerDossiersPartages,
  listerDossiersEleve,
} from "@/lib/casier";
import { MATIERE_PAR_NIVEAU, MATIERE_LABELS } from "@/lib/classes-constants";
import { CasierExplorer } from "@/components/casier/casier-explorer";
import {
  creerDossierEleveAction,
  deplacerDocumentEleveAction,
  deposerFichierAction,
  renommerDossierEleveAction,
  supprimerDocumentEleveAction,
  supprimerDossierEleveAction,
} from "./actions";

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
  const [documentsPartages, dossiersPartages, mesFichiers, mesDossiers] = await Promise.all([
    listerDocumentsPartages(matiere),
    listerDossiersPartages(matiere),
    listerFichiersEleve(session.user.id),
    listerDossiersEleve(session.user.id),
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
        <CasierExplorer
          lectureSeule
          dossiers={dossiersPartages.map((d) => ({ id: d.id, nom: d.nom, nbDocuments: d._count.documents }))}
          documents={documentsPartages.map((d) => ({ id: d.id, nom: d.nom, taille: d.taille, dossierId: d.dossierId }))}
        />
      </section>

      <section className="card animate-fade-in-up flex flex-col gap-3 p-6 [animation-delay:60ms]">
        <h2 className="section-title">Mes fichiers</h2>
        <CasierExplorer
          dossiers={mesDossiers.map((d) => ({ id: d.id, nom: d.nom, nbDocuments: d._count.documents }))}
          documents={mesFichiers.map((d) => ({ id: d.id, nom: d.nom, taille: d.taille, dossierId: d.dossierId }))}
          onCreerDossier={creerDossierEleveAction}
          onRenommerDossier={renommerDossierEleveAction}
          onSupprimerDossier={supprimerDossierEleveAction}
          onSupprimerDocument={supprimerDocumentEleveAction}
          onDeplacerDocument={deplacerDocumentEleveAction}
          uploadAction={deposerFichierAction}
          libelleUpload="Déposer un fichier"
        />
      </section>
    </div>
  );
}
