import Link from "next/link";
import { Suspense } from "react";
import { FileText, ListPlus, PlusCircle } from "lucide-react";
import { Matiere } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listerClasses, NIVEAU_LABELS } from "@/lib/classes";
import { NIVEAU_PAR_MATIERE, estMatiereValide } from "@/lib/classes-constants";
import { MATIERE_LABELS } from "@/lib/cours";
import { AvatarDisplay } from "@/components/avatar/avatar-display";
import { MatiereTabs } from "@/components/matiere-tabs";

export default async function ProfPage({
  searchParams,
}: {
  searchParams: Promise<{ matiere?: string }>;
}) {
  const { matiere: matiereParam } = await searchParams;
  const matiere: Matiere | null = estMatiereValide(matiereParam) ? matiereParam : null;

  const session = await auth();

  const niveauFiltré = matiere ? NIVEAU_PAR_MATIERE[matiere] : undefined;

  const [user, comptesRendusCount, classes] = await Promise.all([
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, nom: true, prenom: true, avatarStyle: true, avatarOptions: true },
        })
      : Promise.resolve(null),
    prisma.compteRendu.count(),
    listerClasses(),
  ]);

  const classesFiltrees = niveauFiltré
    ? classes.filter((c) => c.niveau === niveauFiltré)
    : classes;

  const labelMatiere = matiere ? MATIERE_LABELS[matiere] : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* En-tête prof */}
      <div className="flex items-center gap-4 animate-fade-in-up">
        {user && <AvatarDisplay user={user} neutre taille="lg" />}
        <div>
          <p className="font-mono text-xs font-bold tracking-widest" style={{ color: "rgb(var(--techno-txt))" }}>
            // BONJOUR
          </p>
          <h1 className="page-title">
            {user?.prenom?.trim() || user?.nom?.split(" ")[0] || ""}
          </h1>
        </div>
      </div>

      {/* Onglets matière */}
      <Suspense fallback={null}>
        <MatiereTabs matiereActive={matiere} basePath="/prof" storageKey="prof-matiere-filtre" />
      </Suspense>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in-up [animation-delay:60ms]">
        <Link href="/prof/cours/nouveau" className="tile-arcade">
          <span className="icon-badge-nsi">
            <PlusCircle className="h-5 w-5" />
          </span>
          <p className="font-semibold text-ink-primary">Créer un cours</p>
          <p className="text-sm text-ink-secondary">
            {labelMatiere
              ? `Ajoute un nouveau cours de ${labelMatiere}.`
              : "Ajoute un cours de Technologie, SNT ou NSI."}
          </p>
        </Link>

        <Link href="/prof/cours" className="tile-arcade">
          <span className="icon-badge-snt">
            <ListPlus className="h-5 w-5" />
          </span>
          <p className="font-semibold text-ink-primary">Mes cours</p>
          <p className="text-sm text-ink-secondary">
            Gère tes cours, leurs corrigés et leurs exercices.
          </p>
        </Link>
      </div>

      {/* Comptes-rendus */}
      <Link
        href="/prof/comptes-rendus"
        className="card-hard card-hard-nsi flex items-center justify-between p-6 animate-fade-in-up [animation-delay:120ms]"
      >
        <div className="flex items-center gap-3">
          <span className="icon-badge-nsi">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="section-title">Comptes-rendus</h2>
            <p className="text-sm text-ink-secondary">
              Travaux déposés par les élèves depuis les pages d&apos;exercices.
            </p>
          </div>
        </div>
        <p className="font-heading text-3xl font-bold" style={{ color: "rgb(var(--arcade-nsi))" }}>
          {comptesRendusCount}
        </p>
      </Link>

      {/* Mes classes */}
      <section className="card-hard card-hard-techno animate-fade-in-up p-6 [animation-delay:240ms]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <span className="font-mono text-sm" style={{ color: "rgb(var(--arcade-techno))" }}>⚙</span>
            Mes classes{labelMatiere ? ` — ${labelMatiere}` : ""}
          </h2>
          <Link href="/prof/classes" className="text-sm font-medium hover:underline" style={{ color: "rgb(var(--techno-txt))" }}>
            Gérer
          </Link>
        </div>

        {classesFiltrees.length === 0 ? (
          <p className="text-sm text-ink-muted">
            {labelMatiere
              ? `Aucune classe de ${labelMatiere} (${niveauFiltré ? NIVEAU_LABELS[niveauFiltré] : ""}) pour le moment.`
              : "Aucune classe pour le moment."}{" "}
            <Link href="/prof/classes" className="underline" style={{ color: "rgb(var(--techno-txt))" }}>
              {classesFiltrees.length === 0 && classes.length > 0 ? "Créer une classe" : "Crée ta première classe"}
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {classesFiltrees.map((classe) => (
              <li
                key={classe.id}
                className="item-arcade flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink-primary">{classe.nom}</p>
                  <p className="text-sm text-ink-secondary">
                    {NIVEAU_LABELS[classe.niveau]} · {classe.anneeScolaire} ·{" "}
                    {classe.nombreEleves} {classe.nombreEleves > 1 ? "élèves" : "élève"}
                  </p>
                </div>
                <span
                  className="rounded-lg border px-3 py-1 font-mono text-sm font-bold"
                  style={{
                    color: "rgb(var(--snt-txt))",
                    borderColor: "rgba(var(--arcade-snt), 0.35)",
                    background: "rgba(var(--arcade-snt), 0.08)",
                  }}
                >
                  {classe.codeInscription}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
